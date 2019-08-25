'use strict';

const controller = require('../controller')
const get = require('lodash/get');
const houseReaction = '"house"';
const reactionAddedEvent = 'reactionAdded';
const reactionRemovedEvent = 'reactionRemoved';

module.exports.index = async (event, context) => {
  let response = {
    statusCode: 200
  };
  try {

    const body = JSON.parse(event.body);
    const challenge = get(body, 'challenge');
    const eventType = get(body, 'event.type');
    const correctEventType = 
      (eventType == 'reactionAdded' || eventType === 'reactionRemoved') 
      && get(body, 'event.item.type') === 'message';

    if(challenge) {
      response.body = JSON.stringify({ challenge });
    } if(correctEventType) {
      const slackId = get(body, 'event.user');
      const itemUser = get(body, 'event.item_user');
      const timestamp = get(body, 'event.item.ts');
      const reaction = get(body, 'event.reaction');
      const wfhAdded = eventType === reactionAddedEvent && reaction === houseReaction;
      const wfhRemoved = eventType === reactionRemovedEvent && reaction === houseReaction;
      
      const messageExists = await controller.wfhMessageExists(itemUser, timestamp);

      if(!messageExists) {
        response.status = 400;
        response.message = 'Message item is not from WFH slack bot';
        return response;
      }

      if(wfhAdded) {
        try {
          await controller.addToWFHCal(slackId);
        } catch(err) {
          response.statusCode = 400
          response.message = 'Failed to add slack user ' + slackId;
        }
      } else if(wfhRemoved) {
        try {
          await controller.removeFromWFHCal(slackId);
        } catch(err) {
          response.statusCode = 400
          response.message = 'Failed to add slack user ' + slackId;
        }
      } else {
        response.statusCode = 400;
        response.message = 'Reaction is not a supported WFH event';
      }
      
    } else {
      response.statusCode = 400;
      response.message = "Unsupported event type"
    }
  } catch(err) { 
    console.error(err); 
    response.statusCode = 500
    response.message = "Internal server error."
  } 

  return response;
};
