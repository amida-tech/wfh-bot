require('env-yaml').config({path: __dirname + '/../serverless.env-test.yml'});
const { getStartAndEndOfTodayDate } = require('../../opt/time');
const has = require('lodash/has');

const chai = require('chai');
const { expect } = chai;

const { addToCal, removeFromCal } = require('../../opt/google/calendar');

const testCalId = process.env.WFH_GCAL_ID;
const {start, end} = getStartAndEndOfTodayDate();
let eventId;

describe('Add to cal', () => {
  const slackUserEmail = process.env.SLACK_USER_EMAIL;
  it('Successfully adds event to calendar today', async () => {
    let event = await addToCal({
      calendarId: testCalId,  
      attendees: [ slackUserEmail ], 
      summary: 'TEST EVENT ',
      start,
      end
    });
    expect(event).to.exist
    expect(event).to.not.be.empty;
    expect(has(event, 'id')).to.be.true;
    eventId = event.id;
  });
});

describe('Remove from cal', () => {

  it('Successfully removes event from calendar', async () => {
    let res = await removeFromCal({
      calendarId: testCalId,  
      eventId
    });
   expect(res).to.equal(eventId);
  });
});

describe('list events', () => {
  it('includes attendees in list events', () => {

  });
});
