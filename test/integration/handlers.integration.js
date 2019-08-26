require('env-yaml').config({path: __dirname + '/../serverless.env-test.yml'});
const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
const get = require('lodash/get');
const wfhListenerHandler = require('../../handlers/wfhListener').index;
const dailyWFHMessageHandler = require('../../handlers/postDailyWFHMessage').index;
const controller = require('../../controller');
const slack = require('../../util/slack');
const { setUpTablesAndCalendar, deleteTables, clearEventsOneDay } = require('../test-helper');

chai.use(chaiAsPromised);

const { expect } = chai;

const testUserId = process.env.SLACK_USER_ID;
const testUserEmail = process.env.SLACK_USER_EMAIL;
const slackWFHChannel = process.env.SLACK_WFH_CHANNEL;
const slackBotUserId = process.env.WFH_BOT_SLACK_ID;
const message = "Hi! this is the work from home bot. You can place yourself on the work from home calendar, or let your teamates know that you'll be in the office today by selecting either the house :house: or office :office: emoji"



describe('Daily Message Handler', () => {
  before(async () => {
    try{
      await setUpTablesAndCalendar();
    } catch(err){
      console.log(err)
    }
  })
  after(async () => {
    try{
      await deleteTables();
    } catch(err) {
    }
  })
  it('Stores daily message timestamp/channel in dynamodb', async () => {
    let res = await dailyWFHMessageHandler();
    expect(res.statusCode).to.equal(200);
    expect(res.channel).to.equal(slackWFHChannel);
    expect(res.message).to.equal(message);
    expect(res.user).to.equal(slackBotUserId);

    expect(res.timeStamp).to.exist;

    let item = await controller.getMessageByKey(res.timeStamp, res.user);
      
    expect(get(item, 'CHANNEL.S')).to.equal(slackWFHChannel);
    expect(get(item, 'TIMESTAMP.S')).to.equal(res.timeStamp);

  });
});

describe('WFH Listener', async () => {

  before(async () => {
    try{
      await setUpTablesAndCalendar();
    } catch(err){
      console.error(err)
    }
  })
  after(async () => {
    try{
      await deleteTables();
    } catch(err) {
      
    }
  });
  
 
  let slackReactionHouse;
   
  it('Adds event to wfh calendar if message exists in messages table', async () => {
    let messageRes = await dailyWFHMessageHandler();
    slackReactionHouse = {
      event: {
        type: "reactionAdded",
        user: testUserId,
        item: {
          type: 'message',
          channel: slackWFHChannel,
          ts: messageRes.timeStamp
        },
        reaction: '"house"',
        item_user: slackBotUserId,
      }
    };
    let event = {
      body: JSON.stringify(slackReactionHouse)
    }
    await wfhListenerHandler(event);

    let { email } = await slack.getInfoBySlackId(testUserId);
    let hasWFHEventBool = await controller.hasWFHEvent({email});
    expect(hasWFHEventBool).to.be.true;
  });

  it('Removes wfh event if exists in calendar', async () => {
    try{
      await controller.addToWFHCal(testUserId);
    } catch(err){
      // There might be an event from a previous test. 
      // If not, make one.
    } 
    
    slackReactionHouse.event.type = 'reactionRemoved'
    let event = {
      body: JSON.stringify(slackReactionHouse)
    }
    let wfhListenerResult = await wfhListenerHandler(event);
    expect(wfhListenerResult.statusCode).to.equal(200);
    let { email } = await slack.getInfoBySlackId(testUserId);
    let hasWFHEventBool = await controller.hasWFHEvent({email});
    expect(hasWFHEventBool).to.be.false;
  });

  it('throws 400 if message does not exist', async () => {
    slackReactionHouse.event.item.ts = '1234567';
    let event = {
      body: JSON.stringify(slackReactionHouse)
    }
    let wfhListenerResponse = await wfhListenerHandler(event);
    expect(wfhListenerResponse.statusCode).to.equal(400);
  });
});
