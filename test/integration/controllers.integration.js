require('env-yaml').config({path: __dirname + '/../serverless.env-test.yml'});

const moment = require('moment-timezone');
const range = require('lodash/range');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { messagesTableSchema } = require('../../local_util/tableSchema');
const { 
  setUpTablesAndCalendar,
  deleteTables,
  clearEventsOneDay,
} = require('../test-helper');

const { 
  addToWFHCal,
  removeFromWFHCal,
  hasWFHEvent,
  getMessageByKey,
  isCorrectDate
} = require('../../handlers/wfhListener/controller');
//TODO: write tests for daily message controller
const { addToCal, listEvents } = require('../../opt/google/calendar');

const AWSController = require('../../opt/aws/controller');
const { dynamodbConfig } = require('../../local_util/awsLocalConfig');

const {
  getStartAndEndOfTodayDate,
  getStartAndEndOfTodayDateTime
} = require('../../opt/time');

const awsController = new AWSController({
  dynamodb: dynamodbConfig
});

chai.use(chaiAsPromised);

const { expect } = chai;

// These tests require a dynamodb instance running on
// the specified local url formatted: '{http|https}://localhost:xxxx'


describe('Controller' , async () => {

  beforeEach(async () => {
    try{
      await setUpTablesAndCalendar();
    } catch(err){
      console.log(err)
    }
  });

  after(async () => {
    try{
      await deleteTables();
    } catch(err) {
    }
  })

  const testCalId = process.env.WFH_GCAL_ID;

  const slackUserEmail = process.env.SLACK_USER_EMAIL;
  const slackUserId = process.env.SLACK_USER_ID;
  const slackUserFirstName = process.env.SLACK_USER_FIRST_NAME;
  // let eventId;

  const { start, end } = getStartAndEndOfTodayDate();
  const { startDateTime, endDateTime } = getStartAndEndOfTodayDateTime();

  // This test just clears all events for today on the test calendar
  // so that the rest of the tests can go smoothly. It also tests
  // that the create/remove calendar functions are working as a bonus
  it('Clears calendar of all events today', async () => {
    let newEvents = await Promise.all(range(0,3).map(async indx => {
      return await addToCal({
        calendarId: testCalId,  
        attendees: [ {email: slackUserEmail} ], 
        summary: 'TEST EVENT ' + indx,
        start,
        end
      });
    }));

    expect(newEvents.length).to.equal(3);

    let eventsOnCalendar = await listEvents(testCalId);
    
    expect(eventsOnCalendar.length).to.be.greaterThan(2);

    let deletedEvents = await clearEventsOneDay(testCalId);

    expect(deletedEvents.length).to.be.greaterThan(2);

    let newListEvents = await listEvents(testCalId);

    expect(newListEvents.length).to.equal(0);
  });

  it('Adds to WFH calendar today and hasWFHEvent responds true', async () => {

    let res = await addToWFHCal(slackUserId);
    expect(res.status).to.equal('confirmed');
    expect(res.summary).to.equal(slackUserFirstName + ' WFH');
    expect(res.id).to.exist;

    let hasWFHEventBool = await hasWFHEvent({email: slackUserEmail});

    expect(hasWFHEventBool).to.be.true;
    
  });

  it('Does not create Additional WFH calendar events if one exists', async () => {
    
    let res = await addToWFHCal(slackUserId);
    expect(res.status).to.equal('confirmed');
    try{
      await addToWFHCal(slackUserId);
    } catch(err) {
      expect(err.message).to.equal('WFH event already logged for this user');
    }
   
    let events = await listEvents(testCalId);

    expect(events.length).to.equal(1);
  });


  it('Removes WFH event in calendar/table for given day if event exists' , async () => {
    await addToWFHCal(slackUserId);
    await removeFromWFHCal(slackUserId); 
    let res = await hasWFHEvent({slackUserEmail});
    expect(res).to.be.false;
  })

  it('wfhExists responds true when message exists with correct user, channel, timestamp', async () => {
    let timeStamp = '122345';
    let itemUser = 'ABCDE';
    
    await awsController.dynamodb.putItem({
      TableName: messagesTableSchema.TableName,
      Item: {
        ITEM_USER: {S: itemUser},
        TIMESTAMP: {S: timeStamp},
      }
    });

    let res = await getMessageByKey(itemUser, timeStamp);
    expect(res).to.exist;
  });

  it('should respond true when the message is today', async () => {
    let itemUser = 'ABCDE';
    let today = moment.tz('America/New_York').startOf('Day');
    let timeStamp = today.unix();
    let todayDate = today.format('YYYY-MM-DD');
    let timeStampKey = String(timeStamp) + ".000500";
    await awsController.dynamodb.putItem({
      TableName: messagesTableSchema.TableName,
      Item: {
        ITEM_USER: {S: itemUser},
        TIMESTAMP: {S: timeStampKey},
      }
    });

    let message = await getMessageByKey(itemUser,timeStampKey);
    let result = isCorrectDate(message);
    expect(result).to.be.true;
  });

  it('should respond false when the message is not today', async () => {
    let itemUser = 'ABCDE';
    let today = moment.tz('America/New_York').startOf('Day');
    let timeStampToday = today.unix();
    let notTodayTimestamp = moment.unix(timeStampToday - 172800);
    let timeStampKey = String(notTodayTimestamp) + ".000500";
    await awsController.dynamodb.putItem({
      TableName: messagesTableSchema.TableName,
      Item: {
        ITEM_USER: {S: itemUser},
        TIMESTAMP: {S: timeStampKey},
      }
    });

    let message = await getMessageByKey(itemUser,timeStampKey);
    let result = isCorrectDate(message);
    expect(result).to.be.false;
  });

  
});
