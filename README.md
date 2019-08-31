# Dependencies

- [Docker](https://docs.docker.com/v17.12/install/)
- [node 10.16] (https://nodejs.org/en/download/)
- [npm^6](https://docs.npmjs.com/about-npm-versions#the-latest-release-of-npm)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)

# Setup 
 
1) Download dependencies
```npm i```
```npm i -g serverless```

2) copy config files
```cp serverless.env.example.yml serverless.env.yml```
```cp test/serverless.env-test.example.yml test/serverless.env-test.yml```

3) Configure google authentication information (this part is depressingly manual)
- visit this [link](https://developers.google.com/calendar/quickstart/nodejs) and click "enable google calendar"

- click "Download Client Configuration"

- Once you download the credentials.json, copy the Client ID, secret, and projectId/quickstartId into both the serverless.env.yml and serverless.env-test.yml files (an automated script for that part would be hepful)

- then, 
  run ```npm run generate-google-token``` 
  go to the link provided and enter the code into the command prompt.

4) setting up local dynamodb
- ```docker run -p 8000:8000 amazon/dynamodb-local```
- ```npm run generate-tables```


Then you can get the rest of the environment variables including the slack bot's token and slack id from one pass.

## Setting up the slack bot via Slack App
Go to the [slack apps home page](https://api.slack.com/apps) and click "create app"


## AWS Roles and permissions
If you don't have an AWS account, [set one up](https://aws.amazon.com/)

# Known bugs/issues

1) Currently, if a user removes a work-from-home reaction from a previous day's message, it will delete their event from the current day's calendar. 
2) Events may not happen in sequence. Adding a reaction and then deleting it fires off two different lambdas. This leaves the potential for the deletion lambda to trigger first, and the addition lambda to be fired second, leaving the event on the calendar.
3) While there is currently some code for adding work-from-home events on a specific date, it is not ready or tested. 




