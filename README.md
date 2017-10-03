# BotkitTesting - For building test to botkit bots

For now is experimental

## Example of conversation
```javascript
module.exports = function(bot, controller){
  controller.hears(['hello'], 'direct_message', function(bot, message){
    bot.reply(message, 'hello human');
  });

  controller.hears('hi bot',['direct_message','direct_mention','mention'], (bot,message) => {
    bot.startConversation(message, (err,convo) => {
      convo.say('hi human');
      convo.ask('How are you?', [
        {
          default: true,
          callback: function(response,convo) {
            convo.next();
          }
        }
      ]);
      convo.on('end', (convo) => {
        if (convo.status == 'completed') {
          bot.reply(message, 'fine thanks');
        }
      });
    });
  });
};
```
## Example of test
```javascript
const botMock = require('botkit-testing').create();
const testedFile = require("../src/bots/simple");
const assert = require('assert');

describe("simple controller",() => {
  beforeEach((done) => {
    testedFile(botMock.bot, botMock.controller);
    done();
  });

  it('hello', (done) => {
    botMock.testRunner
      .human('hello')
      .bot('hello human')
      .start(done)
    ;
  });

  it('hi bot', (done) => {
    botMock.testRunner
      .human('hi bot')
      .bot('hi human')
      .bot('How are you?')
      .human('fine thanks you, and you?')
      .bot('fine thanks')
      .start(done)
    ;
  });
});
```
