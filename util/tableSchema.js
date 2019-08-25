module.exports = {
  // I think there's a way to generate tables from the serverless-dynamodb plugin,
  // which would be better as a source of truth for th database schema... 
  // but this is quicker for now. 
  messagesTableSchema: {
    TableName: process.env.MESSAGES_TABLE,
    AttributeDefinitions: [
      {
        AttributeName: 'TIMESTAMP',
        AttributeType: 'S',
      },
      {
        AttributeName: 'ITEM_USER',
        AttributeType: 'S'
      },
    ],
    KeySchema: [
      {
        AttributeName: 'ITEM_USER',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'TIMESTAMP',
        KeyType: 'RANGE',
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1, 
      WriteCapacityUnits: 1
    },
    BillingMode: 'PROVISIONED'
  }
}
