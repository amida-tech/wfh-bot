/*
  This script sets up all AWS controller configuration
  Each configuration will be fed directly into the
  correspoding aws-sdk service constructor.
*/

let dynamodbConfig = {}
if(process.env.REGION) {
  dynamodbConfig.region = process.env.REGION;
}
if(process.env.LOCAL_DYNAMODB_ENDPOINT) {
  dynamodbConfig.endpoint = process.env.LOCAL_DYNAMODB_ENDPOINT;
}
// let s3Config;
// etc...

module.exports = {
  dynamodbConfig,
  // s3Config
  // etc...
}