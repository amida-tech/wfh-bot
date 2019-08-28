/*
  This script sets up all AWS controller configuration
  Each configuration will be fed directly into the
  correspoding aws-sdk service constructor.
*/

let dynamodbConfig;
// let s3Config;
// etc...

if(process.env.STAGE === 'local' && process.env.LOCAL_DYNAMODB_ENDPOINT) {
  dynamodbConfig = {
    region: 'localhost',
    endpoint: process.env.LOCAL_DYNAMODB_ENDPOINT,
  }
  console.log("dynamodb set to locahost")
  // s3Config = {region: 'localhost' }
  // etc...
} else {
  dynamodbConfig = {
    region: process.env.REGION,
  }
  console.log("dynamodb set to " + process.env.REGION);

}


module.exports = {
  dynamodbConfig,
  // s3Config
  // etc...
}