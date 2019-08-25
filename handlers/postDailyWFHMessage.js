const controller = require('../controller')
const messageText = "Hi! this is the work from home bot. You can place yourself on the work from home calendar, or let your teamates know that you'll be in the office today by selecting either the house :house: or office :office: emoji"


module.exports.index = async (event, context) => {
  const response = {
    statusCode: 200
  }
  try {
    let res = await controller.postWFHDailyMessage(messageText);
    if(res.ok) {
      let {ts, channel, message} = res
      await controller.putInMessagesTable({ts, channel, itemUser: message.user});
      response.timeStamp = res.ts;
      response.channel = res.channel;
      response.message = message.text;
      response.user = message.user;
    } else {
      response.statusCode = 500;
      response.message = "Internal server error";
      response.error = res.error;
    }
    
  } catch(err){
    response.statusCode = 500;
    response.message = "Internal server error";
    response.error = err;
  }

  return response;
}