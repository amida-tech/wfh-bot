const argv = require('yargs').argv
const path = require('path');
const term = require( 'terminal-kit' ).terminal;
const fs = require('fs');
const YAML = require('yaml');

let filePath;

if(!argv.p) {
  term.red("Please enter a file path uing the \"-p\" flag\n");
  process.exit();
} else {
  filePath = argv.p;
}

term.on( 'key' , function( name ) {
  if ( name === 'CTRL_C' ) { process.exit(); }
} ) ;

let inputField = ({_default, notRequired })=> new Promise((resolve, reject) => {
  term.inputField({},(error, input) => {
    if(error) {
      reject(error);
    } else if(input){
      resolve(input);
    } else if(notRequired){
      resolve("");
    }else if(_default) {
      resolve(_default);
    } else {
      term.red("\nError: no input value\n")
      reject();
    }
  });
})

const main = async () => {

  try {
  
  const doc = new YAML.Document();

  // variables in caps will go into yml file
  let STAGE,
      LOCAL_DYNAMODB_ENDPOINT,
      LAYER_PATH,
      SLACK_BOT_API_TOKEN,
      SLACK_WFH_CHANNEL_NAME,
      SLACK_WFH_CHANNEL,
      WFH_BOT_NAME,
      WFH_BOT_SLACK_ID,
      WFH_GCAL_ID, 
      MESSAGES_TABLE,
      REGION,
      GOOGLE_CLIENT_ID,
      GOOGLE_PROJECT_ID,
      GOOGLE_AUTH_URI = 'https://accounts.google.com/o/oauth2/auth',
      GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token',
      GOOGLE_AUTH_PROVIDER_X509_CERT_URL = 'https://www.googleapis.com/oauth2/v1/certs',
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URIS_1 = 'urn:ietf:wg:oauth:2.0:oob',
      GOOGLE_REDIRECT_URIS_2 = 'http://localhost',
      SLACK_USER_ID,
      SLACK_USER_EMAIL,
      SLACK_USER_FIRST_NAME;

    term.yellow("\n\nCaution: This script will overwrite the file you point it to.\n\n");

    term.green("This script will generate both serverless.env.yml and erverless.env-test.yml using the values provided.");
    
    term("\nEnter stage (default \"LOCAL\"):")
    STAGE = await inputField({_default:"LOCAL"});

    term("\nEnter AWS Region (default us-east-1):")
    REGION = await inputField({_default:"us-east-1"});

    term("\nEnter alternative lambda layer path (\"opt\" directory) (If stage is \"LOCAL\" default is `${process.cwd()}/opt`, otherwise just \"/opt\"):");
    if(STAGE === 'LOCAL') {
      LAYER_PATH = await inputField({_default: path.join(process.cwd(), "/opt")});
    } else {
      LAYER_PATH = await inputField({_default: "/opt"});
    }
    
    term("\nEnter local DynamoDB URL (Not required. default http://localhost:8000 if stage is \"LOCAL\"):");
    if(STAGE === 'LOCAL') {
      LOCAL_DYNAMODB_ENDPOINT = await inputField({_default:"http://localhost:8000"});
    } else {
      LOCAL_DYNAMODB_ENDPOINT = await inputField({notRequired: true});
    }
    term("\nEnter slack bot user API token (required):");
    SLACK_BOT_API_TOKEN = await inputField({});
    process.env.SLACK_BOT_API_TOKEN = SLACK_BOT_API_TOKEN;
    const { getChannelIdByName, getSlackBotIdByName, getInfoByEmail } = require('../opt/slack');

    term("\nEnter slack work from home channel name (required, should be unique from other channels): ");
    SLACK_WFH_CHANNEL_NAME = await inputField({});

    term("\nEnter work from home bot name (required, should be unique from other users): ");  
    WFH_BOT_NAME = await inputField({});

    term("\nEnter google calendar Id (required):");
    WFH_GCAL_ID= await inputField({});

    term("\nEnter Test Slack User Email (not required, but this user should also have a google account with read access to the previously submitted calendar):");
    SLACK_USER_EMAIL = await inputField({notRequired: true});

    term("\nEnter dynamodb table name (default WFH_MESSAGES_TABLE, stage will be appended):");
    MESSAGES_TABLE = await inputField({_default: "WFH_MESSAGES_TABLE"});

    term("\nEnter google client id (required):")
    GOOGLE_CLIENT_ID = await inputField({});

    term("\nEnter google project id (required):")
    GOOGLE_PROJECT_ID = await inputField({});

    term("\nEnter google client secret (required):")
    GOOGLE_CLIENT_SECRET = await inputField({});

    SLACK_WFH_CHANNEL = await new Promise(async (resolve, reject) => {
      try {
        let channelId = await getChannelIdByName(SLACK_WFH_CHANNEL_NAME);
        if(channelId) {
          resolve(channelId);
        } else {
          reject("No channel Id found for that channel name")
        }
      } catch(err) {
        reject(err);
      }
    });
    
    WFH_BOT_SLACK_ID = await new Promise(async (resolve, reject) => {
      try {
        let wfhBotId = await getSlackBotIdByName(WFH_BOT_NAME);
        if(wfhBotId) {
          resolve(wfhBotId);
        } else {
          reject("No bot user found with that name")
        }
      } catch(err) {
        reject(err);
      }
    });


    if(SLACK_USER_EMAIL === "") {
      SLACK_USER_ID = "";
      SLACK_USER_FIRST_NAME = "";
    } else {
      const { id, first_name } = await new Promise(async (resolve, reject) => {
        try {
          let member = await getInfoByEmail(SLACK_USER_EMAIL);
          
          if(member) {
            let id = member.id, first_name = member.profile.first_name;
            resolve({id, first_name});
          } else {
            reject("No slack user found with that email");
          }
        } catch(err) {
          reject(err);
        }
      });
  
      if(id)  {
        SLACK_USER_ID = id;
      }
      if(first_name) {
        SLACK_USER_FIRST_NAME = first_name;
      }
    }
    
    const contents = {
      STAGE,
      LOCAL_DYNAMODB_ENDPOINT,
      LAYER_PATH,
      SLACK_BOT_API_TOKEN,
      SLACK_WFH_CHANNEL_NAME,
      SLACK_WFH_CHANNEL,
      WFH_BOT_NAME,
      WFH_BOT_SLACK_ID,
      WFH_GCAL_ID, 
      MESSAGES_TABLE: MESSAGES_TABLE + "_" + STAGE,
      REGION,
      GOOGLE_CLIENT_ID,
      GOOGLE_PROJECT_ID,
      GOOGLE_AUTH_URI,
      GOOGLE_TOKEN_URI,
      GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URIS_1,
      GOOGLE_REDIRECT_URIS_2,
    };

    if(SLACK_USER_EMAIL) {
      Object.assign(contents, {
        SLACK_USER_EMAIL,
        SLACK_USER_FIRST_NAME,
        SLACK_USER_ID
      })
    }

    doc.contents = contents;

    term("\n\n\nthese are your environment files. Are they correct?")

    term.green("\n\n" + filePath + "\n\n");

    term(doc.toString());

    term("\n(y/n):\n")

    await new Promise((resolve, reject) => {
      term.yesOrNo( { yes: [ 'y' , 'ENTER' ] , no: [ 'n' ] }, (error, result) => {
        if(error) {
          reject(error)
        }
        if(result) {
          term.green( "writing file...\n" );
          fs.writeFileSync(path.join(process.cwd(), filePath), doc.toString());
          resolve();
        }
        else {
          term.red( "Sorry. Please try again.\n" );
          reject();
        }
      }) ;
    });
    
  } catch(err) {
    if(err) {
      console.error(err);
    }
    process.exit();
  }
}

main()
  .then(() => {
    term.green("\nDone.\n");
    process.exit();
  })
  .catch(error => {
    console.error(error);
    process.exit();
  });