"use strict";
const uuidv4 = require('uuidv4');
const AWSController = require('./util/aws/controller');
const { listEvents, addToCal, removeFromCal } = require('./util/google/calendar');
const { getInfoBySlackId, postMessage } = require('./util/slack');
const { dynamodbConfig } = require('./awsConfig');
const has = require('lodash/has');
const get = require('lodash/get');
const {
  getStartAndEndOfDateDate,
  getStartAndEndOfTodayDate,
} = require('./util/time');
let x = process.env;
const awsController = new AWSController({
  dynamodb: dynamodbConfig
});
const messagesTable = process.env.MESSAGES_TABLE;
const wfhTable = process.env.WFH_TABLE;
const gCalIdTravel = process.env.WFHL_GCAL_ID;
const gCalIdWFH = process.env.WFH_GCAL_ID;
const slackWFHChannel = process.env.SLACK_WFH_CHANNEL;
const slackBotUserId = process.env.WFH_BOT_SLACK_ID;


const listAvailabilityEvents = async (gCalId, date) => {
 
  try {
    let res = await listEvents(gCalId, date);
    const events = res.data.items;
    
    if (events && events.length) {
      console.log(`${events.length} upcoming events`);
      let eventObjects = events.map((e, i) => {
        let eventObject = {};
        eventObject.start = e.start.dateTime || e.start.date;
        eventObject.end = e.end.dateTime || e.end.date;
        eventObject.humanEnd = moment(eventObject.end).format('MMM Do');
        eventObject.machineEnd = moment(eventObject.end).format('X'); // unix timestamp for sorting
        eventObject.summary = e.summary;
        eventObject.eventId = e.id;

        let regExec = xregexp.exec(e.summary, /(\w*)(?:'s)? (PTO|OOO|remote|WFH)/i)
        if (!regExec) { return; }
        eventObject.name = regExec[1];
        eventObject.type = regExec[2];
        if(eventObject.type.toLowerCase() === 'ooo' || eventObject.type.toLowerCase() === 'pto') { 
          eventObject.type = 'OOO'; 
        }
        
        if(eventObject.type.toLowerCase() === 'remote') { 
          eventObject.type = 'REMOTE';
        }

        if(eventObject.type.toLowerCase() === 'wfh') {
          eventObject.type = 'WFH';
        }

        return eventObject;

      });

      // sort in ascending order by end date
      return eventObjects.sort((a, b) => a.machineEnd - b.machineEnd);
    } else {
      console.log('No upcoming events found.');
    }
  } catch(err) {
    console.error(err);
    throw new Error(err);
  }
}

const listEventsWFH = async (date) => {
  try {
    return await listAvailabilityEvents(gCalIdWFH, date);
  } catch(err) {
    throw new Error(err);
  }
}

const listEventsOOO = async () => {
  try{
    return await listAvailabilityEvents(gCalIdWFH, date);
  } catch(err) {
    throw new Error(err);
  }
}

const hasWFHEvent = async ({email, date}) => {
  let events = await listEvents(gCalIdWFH, date);
  let userEvents = events.filter(event => {
    if(event.attendees) {
      let hasAttendee = event.attendees.some(attendee => {
        return attendee.email == email
      });
      return hasAttendee;
    }

    return false;
  });
  return !(userEvents.length == 0);
}

const wfhMessageExists = async (itemUser, timestamp, channel) => {
  let req = {
    TableName: messagesTable,
    Key: {
      TIMESTAMP: {S: timestamp},
      ITEM_USER: {S: itemUser}
    }
  }
  return !!(await awsController.dynamodb.getItem(req));
}

const addToWFHCal = async (slackId, date) => {

  const { start, end } = date ? getStartAndEndOfDateDate(date) : getStartAndEndOfTodayDate()
  
  const { email, first_name } = await getInfoBySlackId(slackId);  
  const summary = first_name + ' WFH';
  const attendees = [{email}];
  //Might need to also check gcal for events created by non-wfh gcal user to keep table consistent w/ calendar
  let hasEvent = await hasWFHEvent({email, date});
  if(!hasEvent) {
    const res = await addToCal({calendarId: gCalIdWFH, attendees, summary, start, end});
  
    if(res.status === 'confirmed') {
      console.log(`event created for ${email} with event ID: ${res.id}`)
      return res;
    } else {
      console.error(JSON.stringify({
        statusCode: res.status,
        message: res.message
      }, null, 2))
    }
    throw new Error(res.message);
  } else {
    
    console.error({
      msg:'WFH event already logged for this user',
      slackId,
      email
    })
    throw new Error('WFH event already logged for this user');
  }

}

const removeFromWFHCal = async (slackId, date) => {
  const { start } = date ? getStartAndEndOfDateDate(date) : getStartAndEndOfTodayDate()

  try {
    //First check if they're on the calendar for the specified date
    const { email } = await getInfoBySlackId(slackId);  
    let item = await awsController.dynamodb.getItem({
      TableName: wfhTable,
      Key: {
        START_DATE: {S: start },
        EMAIL: {S: email },
      }
    });

    if(item) {
      const eventId = get(item, 'CAL_EVENT_ID.S');
      await removeFromCal({calendarId: gCalIdWFH, eventId});
      await awsController.dynamodb.deleteItem({
        TableName: wfhTable,
        Key: {
          START_DATE: {S: start },
          EMAIL: {S: email },
        }
      });

      return true;
    } else {
      console.error({
        msg: 'No event to delete for slack user',
        slackId,
        email
      })
    }

  } catch(err) {
    console.error(err);
    throw new Error(err);
  }
}

// Clears all events for given calendarId/date or today
// if date is undefined
const clearEventsOneDay = async(calendarId, date) => {
  try{
    const events = await listEvents(calendarId, date);
    if(events && events.length) {
      let promises = events.map(async event => {
        if(has(event, 'id')) {
          return await removeFromCal({calendarId, eventId: event.id});
        }
      });
      return await Promise.all(promises);
    }
  } catch(err) {
    console.error(err);
    throw new Error(err);
  }
}

// //Do we want the bot to be able to edit peoples' calendars?
// //Do we want the bot to do so even if able?
const addToUserCal = async (slackId, date) => {
  //Stub
}

const putInMessagesTable = async({ts, channel, itemUser}) => {
  let req = {
    TableName: messagesTable,
    Item: {
      TIMESTAMP: {S: ts},
      CHANNEL: {S: channel},
      ITEM_USER: {S: itemUser},
      UUID: { S: uuidv4() }
    }
  }
  return await awsController.dynamodb.putItem(req);
}

const postWFHDailyMessage = async (message) => {
  return await postMessage(slackWFHChannel, message, slackBotUserId);
}


const getMessageByKey = async (timeStamp, itemUser) => {
  return await awsController.dynamodb.getItem({
    TableName: messagesTable,
    Key: {
      TIMESTAMP: { S: timeStamp },
      ITEM_USER: { S: itemUser }
    }
  });
}

module.exports = {
  listEventsOOO,
  listEventsWFH,
  addToWFHCal,
  removeFromWFHCal,
  clearEventsOneDay,
  putInMessagesTable,
  postWFHDailyMessage,
  getMessageByKey,
  wfhMessageExists,
  hasWFHEvent
}
