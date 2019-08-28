//TODO fix this require failing silently
require('env-yaml').config({path: process.cwd() + '/serverless.env.yml'});
const { messagesTableSchema } = require('./tableSchema');

const AWSController = require('../opt/aws/controller');
const awsController = new AWSController({
  dynamodb: {
    region: 'localhost',
    endpoint: process.env.LOCAL_DYNAMODB_ENDPOINT,
  }
});


awsController.dynamodb.createTable(messagesTableSchema).then(console.log)
