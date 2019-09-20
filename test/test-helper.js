const has = require('lodash/has');
const { messagesTableSchema } = require('../local_util/tableSchema');
const { dynamodbConfig } = require('../local_util/awsLocalConfig');
const { removeFromCal, listEvents } = require('../opt/google/calendar');
const AWSController = require('../opt/aws/controller');
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

// const deleteTables = async () => {
//   try{
//     await awsController.dynamodb.deleteTable(
//       {
//         TableName: messagesTable
//       }
//     );
//   } catch(err) {
//   }
// }

// const setUpTablesAndCalendar = async () => {
//   try{
//     await deleteTables();
//   }catch(err){
//     console.error('test setup error deleting tables')
//   }
//   try{
//     await createTables();
//   }catch(err){
//     console.error('test setup error ceating tables')
//   }
//   try{
//     await clearEventsOneDay(testCalId);
//   }catch(err){
//     console.error('test setup error clearing calendar events')
//   }
// };

// Clears all events for given calendarId/date or today
// if date is undefined
// const clearEventsOneDay = async(calendarId, date) => {
//   try{
//     const events = await listEvents(calendarId, date);
//     if(events && events.length) {
//       let promises = events.map(async event => {
//         if(has(event, 'id')) {
//           return await removeFromCal({calendarId, eventId: event.id});
//         }
//       });
//       return await Promise.all(promises);
//     }
//   } catch(err) {
//     console.error(err);
//     throw new Error(err);
//   }
// }

module.exports = {
  // setUpTablesAndCalendar,
  // deleteTables,
  // clearEventsOneDay
}