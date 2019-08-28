const controller = require('./controller');
const messageText = "Hi! this is the work from home bot. You can place yourself on the work from home calendar, or let your teamates know that you'll be in the office today by selecting either the house :house: or office :office: emoji"


module.exports.handler = async () => {
  const response = {
    statusCode: 200,
    headers: { 
      'Content-Type': 'application/json'
    },
    isBase64Encoded: false
  }
  try {
    let res = await controller.postWFHDailyMessage(messageText);
    if(res.ok) {
      let {ts, channel, message} = res
      await controller.putInMessagesTable({ts, channel, itemUser: message.user});
      response.body = JSON.stringify({
        timeStamp: res.ts,
        channel: res.channel,
        message: message.text,
        user: message.user,
      });
    } else {
      response.statusCode = 500;
      response.body = JSON.stringify({
        message: "Internal server error"
      });
      console.error(res)
    }
    
  } catch(err){
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "Internal server error"
    });
    console.error(err)
  }

  return response;
}