##Setup First cp serverless.env.example.yml serverless.env.yml cp serverless.env.example.yml test/serverless.env-test.yml

visit this link: https://developers.google.com/calendar/quickstart/nodejs and click "endable google calendar"

Once you download the credentials.json, place the values into the corresponding values in both the serverless.env.yml and serverless.env-test.yml files (an automated script for that part would be hepful)

then, run npm run generate-google-token and follow the instructions

Then you can get the rest of the environment variables including the slack bot's token and slack id from one pass.
