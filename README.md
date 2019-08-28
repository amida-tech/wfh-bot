# Setup 
 
1) Download dependencies
```npm i```
```npm i -g serverless```

2) copy config files
```cp serverless.env.example.yml serverless.env.yml```
```cp test/serverless.env-test.example.yml test/serverless.env-test.yml```

3) Configure google authentication information (this part is depressingly manual)
- visit this link: https://developers.google.com/calendar/quickstart/nodejs and click "enable google calendar"

- click "Download Client Configuration"

- Once you download the credentials.json, copy the Client ID, secret, and projectId/quickstartId into both the serverless.env.yml and serverless.env-test.yml files (an automated script for that part would be hepful)

- then, 
  run ```npm run generate-google-token``` 
  go to the link provided and enter the code into the command prompt.


Then you can get the rest of the environment variables including the slack bot's token and slack id from one pass.

## Setting up the slack bot via Slack App



## AWS Roles and permissions

