const { messagesTableSchema, wfhTableSchema } = require('../util/tableSchema');
const { 
  clearEventsOneDay
} = require('../controller');
const { dynamodbConfig } = require('../awsConfig');
const AWSController = require('../util/aws/controller');
const awsController = new AWSController({
  dynamodb: dynamodbConfig
});
const testCalId = process.env.WFH_GCAL_ID;
const messagesTable = process.env.MESSAGES_TABLE;

const createTables = async () => {
  try {
    await awsController.dynamodb.createTable(messagesTableSchema);
  } catch(err) {
  }
}

const deleteTables = async () => {
  try{
    await awsController.dynamodb.deleteTable(
      {
        TableName: messagesTable
      }
    );
  } catch(err) {
  }
}

const setUpTablesAndCalendar = async () => {
  try{
    await deleteTables();
  }catch(err){
  }
  try{
    await createTables();
  }catch(err){
  }
  try{
    await clearEventsOneDay(testCalId);
  }catch(err){
  }
};

module.exports = {
  setUpTablesAndCalendar,
  deleteTables,
  clearEventsOneDay
}