require('env-yaml').config({path: __dirname + '/../serverless.env-test.yml'});

const range = require('lodash/range');
const some = require('lodash/some');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { messagesTableSchema, wfhTableSchema } = require('../../util/tableSchema');
const { setUpTablesAndCalendar, deleteTables } = require('../test-helper');

const { 
  addToWFHCal,
  removeFromWFHCal,
  clearEventsOneDay,
  wfhMessageExists,
  hasWFHEvent
} = require('../../controller');
const { addToCal, listEvents, updateEvent } = require('../../util/google/calendar');

const AWSController = require('../../util/aws/controller');

const {
  getStartAndEndOfDateDate,
  getStartAndEndOfTodayDate,
  getStartAndEndOfTodayDateTime
} = require('../../util/time');

const awsController = new AWSController({
  dynamodb: {
    region: 'localhost',
    endpoint: process.env.LOCAL_DYNAMODB_ENDPOINT,
  },
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
    const itemRes = await awsController.dynamodb.getItem({
      TableName: wfhTableSchema.TableName,
      Key: {
        START_DATE: {S: start },
        EMAIL: {S: slackUserEmail },
      }
    });
    expect(itemRes).to.be.undefined;
  })

  it('wfhExists responds true when message exists with correct user, channel, timestamp', async () => {
    let timeStamp = '122345';
    let itemUser = 'ABCDE';
    awsController.dynamodb.putItem({
      TableName: messagesTableSchema.TableName,
      Item: {
        ITEM_USER: {S: itemUser},
        TIMESTAMP: {S: timeStamp},
      }
    });

    //TODO: Finish this test
    let res = await wfhMessageExists(itemUser, timeStamp);

    expect(res).to.be.true;
  });
  
});
