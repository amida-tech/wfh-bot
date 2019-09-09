//TODO fix this require failing silently
require('env-yaml').config({path: process.cwd() + '/serverless.env-local.yml'});
const { messagesTableSchema } = require('./tableSchema');

const AWSController = require('../opt/aws/controller');
const { dynamodbConfig } = require('../local_util/awsLocalConfig');

const awsController = new AWSController({
  dynamodb: dynamodbConfig
});
awsController.dynamodb.createTable(messagesTableSchema).then(console.log)
