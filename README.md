# Description

This is a serverless slack bot that can be used by teams to place work from home events on a google calendar via emoji reactions to a daily prompt. 

# Usage

One the bot is deployed 

# Dependencies

- [Docker](https://docs.docker.com/v17.12/install/)
- [node 10.16](https://nodejs.org/en/download/)
- [npm^6](https://docs.npmjs.com/about-npm-versions#the-latest-release-of-npm)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)

# Setup 
 
1) Download dependencies
  - ```npm i```
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

  - then, 
  run ```npm run generate-google-token``` 
  go to the link provided and enter the code into the command prompt.
  
## Setting up the slack bot via Slack App
5) Go to the [slack apps home page](https://api.slack.com/apps) and click "create app"
6) Once your app ha been created, navigate to "bot users" and click "add a bot user" 
7)  Navigate to "OAuth & permissions", scroll down to "scopes" and add the following permissions:
  - reactions:read
  - users:read
  - chat:write:bot
8) Naviagate up to "install app in workspace" to install the app in your workspace, which will give your bot user an API token.
9) copy the "Bot User OAuth Access Token" to your serverless.env.yml & serverless.test-env.yml files.

## Run tests
- ```npm test```
- If all pass, you're good to go

## Local development: 

1) local dynamodb: 
  - ```docker run -p 8000:8000 amazon/dynamodb-local```
  - ```npm run generate-tables```
2) Locally running the api:
  - ```sls offline```
3) invoking a function:
  -  ```sls invoke -n {function name}```


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
- Integration tests: ```npm run test-integration```
- unit tests: ```npm run test-unit```
- test handlers: ```npm run test-handlers```


# Current known bugs/issues

1) Currently, if a user reacts to a previous day's message, it will add/delete an event for the current date. Not the date of the message.
2) Race condition between adding/removing a reaction. Adding a reaction and then deleting it fires off two different instances of the listener lambda. This leaves the potential for the deletion lambda to trigger first, and the addition lambda to be fired second, leaving the event on the calendar.
3) While there is currently some code for adding work-from-home events on a specific date, it is not ready or tested.
4) It should not be necessary to run the "createTables" script for local development and tests. serverless-dyanmodb-local should take care of that but I haven't yet figured out how that works. 
5) The bot does not yet post a message on a scheduled basis. The serverless file needs a cloudwatch event.





