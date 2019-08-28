"use strict";
console.log(process.env)

const path = require('path');
const layerPath = process.env.STAGE === 'local' ? `${process.cwd()}` + '/opt' : '/opt';
const uuidv4 = require('uuidv4');
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
