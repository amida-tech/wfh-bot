# Description

This is a serverless slack bot that can be used by teams to place work from home events on a google calendar via emoji reactions to a daily prompt. 

# Usage

One the bot is deployed, it will post a message to the specified slack channel every morning at the specified time. To add an event to the designated "work from home" calendar, you can reply to the message with a "house" emoji. 

# Dependencies

- [Docker](https://docs.docker.com/v17.12/install/)
- [node 10.16](https://nodejs.org/en/download/)
- [npm^6](https://docs.npmjs.com/about-npm-versions#the-latest-release-of-npm)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)

# Setup 
 
1) Download node dependencies
  - ```npm install-all-node-modules```  <- A common paradigm of serverless applications is to have separate node_modules in each lambda, as well as in each layer, and your test directory or top level directory for local development. This command installs node_modules in each directory as necessary. 
  
  - ```npm i -g serverless```

2) copy config files
  - ```cp serverless.env.example.yml serverless.env.yml```
  - ```cp test/serverless.env-test.example.yml test/serverless.env-test.yml```
  
## Setting up google calendar & authentication

3) Create a google calendar to be accessed by your slack bot. Navigate to the calendar's settings and copy the calendar Id into the serverless.env.yml and serverless.test-env.yml files under WFH_GCAL_ID.

4) Configure google authentication information
  - visit this [link](https://developers.google.com/calendar/quickstart/nodejs) and click "enable google calendar"

  - click "Download Client Configuration"

  - Once you download the credentials.json, copy the Client ID, secret, and projectId/quickstartId into both the serverless.env.yml and serverless.env-test.yml files (an automated script for that part would be hepful)

  - then, run ```npm run generate-google-token``` and go to the link provided. Enter the code from the link into the command prompt.
  
## Setting up the slack bot via Slack App
5) Go to the [slack apps home page](https://api.slack.com/apps) and click "create app"
6) Once your app ha been created, navigate to "bot users" and click "add a bot user" 
7)  Navigate to "OAuth & permissions", scroll down to "scopes" and add the following permissions:
  - reactions:read
  - users:read
  - chat:write:bot
8) Naviagate up to "install app in workspace" to install the app in your workspace, which will give your bot user an API token.
9) copy the "Bot User OAuth Access Token" to your serverless.env.yml & serverless.test-env.yml files.
10) **This takes place after deployment** 
- After deployment you must subscribe your work-from-home listener lambda to reaction events via your slack app. 
- [Head back to your slack app](https://api.slack.com/apps) and navigate to event subscriptions.
- Subscribe to reaction events, an past the post url of your work-from-home listener in the provided form. This will send a "challenge" post to the lambda, which will respond back with the challenge parameter.

## Run tests
- ```npm test```
- If all pass, you're good to proceed to deployment

# Deployment

## Local development: 

1) local dynamodb: 
  - ```docker run -p 8000:8000 amazon/dynamodb-local```
  - ```npm run generate-tables```
2) Locally running the api:
  - ```sls offline```
3) invoking a function:
  -  ```sls invoke -n {function name}``` <- need to make sure this works and add more local development commands. 


## AWS Roles and permissions
- If you don't have an AWS account, [set one up](https://aws.amazon.com/)
- Deploying this serverless application requires several permissions, including, but not necessarily limited to:
  - iam:CreateRole
  - iam:GetRole
  - iam:AttachRolePolicy
  - iam:AddRoleToInstanceProfile
  - cloudformation:CreateStack
  - cloudformation:DescribeStacks
  - cloudformation:DescribeStackEvents
  - cloudformation:DescribeStackResource
  - cloudformation:ValidateTemplate
  - cloudformation:UpdateStack
  - cloudformation:ListStacks
  - dynamodb:CreateTable
  - dynamodb:DeleteTable
  - lambda:UpdateFunctionCode
  - lambda:UpdateFunctionConfig
  - lambda:GetFunctionConfiguration
  - lambda:AddPermission
  - s3:DeleteObject
  - s3:GetObject
  - s3:ListBucket
  - s3:PutObject
  
# Testing 

- All tests: ```npm test```  
- Unit tests: ```npm run test-unit```
- AWS controller unit test: ```npm run test-aws```
- Integration tests: ```npm run test-integration```
- Calendar integration tests: ```npm run test-calendar```
- Slack integration tests: ```npm run test-slack```
- Handler integration tests: ```npm run test-handlers```
- Controller integration tests: ```npm run test-controllers```

# Caveats
1) The bot will invite users to work-from-home events based on their slack emails.
2) The google user authenticated for the wfh bot should have write access to the calendar in question
3) All users that could potentially be invited to a work from home event on the work from home calendar should have read access on that calendar as well. 

# Current known bugs/issues and necessary improvements

1) Currently, if a user reacts to a previous day's message, it will add/delete an event for the current date. Not the date of the message.
2) Race condition between adding/removing a reaction. Adding a reaction and then deleting it fires off two different instances of the listener lambda. This leaves the potential for the deletion lambda to trigger first, and the addition lambda to be fired second, leaving the event on the calendar.
3) While there is currently some code for adding work-from-home events on a specific date, it is not ready or tested.
4) Requiring the entire AWS-sdk is cumbersome and delays lambda cold starts. The opt layer should only require specific services. Haven't gotten that to work yet. 
5) It should not be necessary to run the "createTables" script for local development and tests. serverless-dyanmodb-local should take care of that but I haven't yet figured out how that works. 
6) The bot does not yet post a message on a scheduled basis. The serverless file needs a cloudwatch event.
7) Many aspects of this should be parameterized. E.g., the message posted, the emoji used for declaring a work from home event, and the time of day that the message should be posted. 
8) At the moment, to determine the correct slack channel ID and your bot's user ID you must call the slack listUsers ad listChannels API and search for the correct user manually. This should be scripted.
9) The google credentials.json file is contructed from environment variables based on the original file downloaded from the google authentication setup. The variables in this file may drift over time.





