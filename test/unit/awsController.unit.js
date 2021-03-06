require('env-yaml').config({path: __dirname + '/../serverless.env-test.yml'});
const AWSController = require('../../opt/aws/controller');
const { dynamodbConfig } = require('../../local_util/awsLocalConfig');

const { messagesTableSchema } = require('../../local_util/tableSchema');
const chai = require('chai');
const { expect } = chai;


const awsController = new AWSController({
  dynamodb: dynamodbConfig
});
// These tests require a dynamodb instance running on
// the specified local url formatted: '{http|https}://localhost:xxxx'

describe('Dynamodb functions', () => {

  const channel = 'slackChannelId'
  const messageDateTime = '01-01-2001';
  const messageUUID =  '1234';
  const itemUser = 'itemUserId'

  it('Successfully creates all tables', async () => {

    let resMessages = await awsController.dynamodb.createTable(messagesTableSchema);

    expect(resMessages.TableDescription).to.not.be.null;
  });

  it('Successfully puts an Item', async () => {
    const putReq = {
      //oops this needs to be updated to use the env variable, not the table schema. 
      TableName: messagesTableSchema.TableName,
      Item: {
        TIMESTAMP: {S: messageDateTime},
        CHANNEL: {S: channel},
        ITEM_USER: {S: itemUser },
        UUID: {S: messageUUID}
      }
    }
    let putRes = await awsController.dynamodb.putItem(putReq);
    expect(putRes).to.be.empty;

  });

  it('successfully gets an Item', async () => {
    let res = await awsController.dynamodb.getItem(
      {
        TableName: messagesTableSchema.TableName,
        Key: {
          TIMESTAMP: { S: messageDateTime },
          ITEM_USER: {S: itemUser }
        }
      }
    );
    expect(res).to.deep.equal({
      TIMESTAMP: { S: messageDateTime },
      CHANNEL: { S: channel },
      ITEM_USER: {S: itemUser },
      UUID: { S: messageUUID }
    })
  });

  it('successfully deletes an Item', async () => {
    let res = await awsController.dynamodb.deleteItem(
      {
        //oops this needs to be updated to use the env variable, not the table schema. 
        TableName: messagesTableSchema.TableName,
        Key: {
          TIMESTAMP: { S: messageDateTime },
          ITEM_USER: {S: itemUser }
        }
      }
    );
    expect(res).to.be.true;
  })

  it('successfully deletes all tables', async () => {
    let resMessages = await awsController.dynamodb.deleteTable(
      {
        //oops this needs to be updated to use the env variable, not the table schema. 
        TableName: messagesTableSchema.TableName
      }
    );
    expect(resMessages.TableDescription).to.not.be.null;
  })
});
