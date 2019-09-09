"use strict";
const path = require('path');
console.log(process.env.LAYER_PATH)
const layerPath = process.env.LAYER_PATH;
const uuidv4 = require('uuidv4').default;
const AWSController = require(path.join(layerPath,'/aws/controller'));
const { postMessage } = require(path.join(layerPath,'/slack'));
const { dynamodbConfig } = require('./awsConfig');
const awsController = new AWSController({
  dynamodb: dynamodbConfig
});
const messagesTable = process.env.MESSAGES_TABLE;
const slackWFHChannel = process.env.SLACK_WFH_CHANNEL;
const slackBotUserId = process.env.WFH_BOT_SLACK_ID;

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
  console.log(dynamodbConfig)
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
  putInMessagesTable,
  postWFHDailyMessage,
  getMessageByKey,
}
