/**
 * @author: Renier Ricardo Figueredo
 * @mail: aprezcuba24@gmail.com
 */

let create = (options) => {
  options = options || {};
  options.disabledLogInfo = options.disabledLogInfo || true;
  options.debugLevel      = options.debugLevel || false;

  var BaseSlackBotWorker = require('../../node_modules/botkit/lib/Slackbot_worker');
  const assert = require('assert');

  function SlackBot(botkit, config) {
    var bot = BaseSlackBotWorker(botkit, config);

    bot.resolveTest = null;

    bot.on = function(event, cb) {
      botkit.on('slack_bot_mock_' + event, cb);
    };
    bot.trigger = function(event, data) {
      botkit.trigger('slack_bot_mock_' + event, data);
    };

    bot.api.callAPI = function (command, data, cb, multipart) {
      bot.trigger('post', [data.text, data]);
      cb();
    };

    bot.mockReceiveMessage = function (message) {
      bot.mockReceive({
        type:    'user_typing',
        channel: 'D3PJX73U1',
        user:    'U3R00R9Y'
      });
      bot.mockReceive({
        type: 'message',
        channel: 'D3PJX73U1',
        user: 'U3Q9URAKF',
        text: message,
        ts: '',
        team: 'T3PGJS133'
      });
    };

    bot.mockReceive = function (data) {
      botkit.receiveMessage(bot, data);
    };

    bot.mockReceive({
      type: 'hello'
    });
    bot.mockReceive({
      type: 'presence_change',
      presence: 'active',
      user: 'U3R00R9Y'
    });

    return bot;
  }

  var Botkit = require('botkit');
  var controller = Botkit.slackbot({
    debug: options.debugLevel
  });
  if (options.disabledLogInfo) {
    controller.log = () => {};
  }
  controller.defineBot(SlackBot);

  var bot = controller.spawn({
    token: 'random_token'
  });

  var conversationTest = function (bot, controller) {
    var conv = {
      _messages:    new Array(),
      _bot:         bot,
      _controller:  controller,
      _msgsArrived: new Array(),
      _done:        function() {},
      _waitForMsg:  ''
    };

    bot.on('post', function (text, data) {
      conv._msgsArrived.push(data);
      if (conv._waitForMsg) {
        conv._get(conv._waitForMsg)
      }
    });

    conv.human = function (msg) {
      this._messages.push({
        type: 'human',
        text:  msg
      });

      return this;
    };

    conv.bot = function (msg) {
      this._messages.push({
        type: 'bot',
        text:  msg
      });

      return this;
    };

    conv.start = function (cb) {
      this._controller.tick();
      if (cb) {
        this._done = cb;
      }
      if (this._messages.length == 0) {
        this._done();
        return;
      }
      var msg = this._messages.shift();
      switch (msg.type) {
        case 'human':
          this._push(msg);
          break;
        case 'bot':
          this._get(msg);
          break;
      }
    };

    conv._push = function (msg) {
      this._bot.mockReceiveMessage(msg.text);
      this._log(msg);
      this.start();
    };

    conv._get = function (msg) {
      var msgArrived = this._msgsArrived.shift();
      if (!msgArrived) {
        this._waitForMsg = msg;
        return;
      }
      this._log(msg);
      assert.equal(msgArrived.text, msg.text);
      this.start();
    };

    conv._log = function (msg) {
      var type = msg.type;
      if (type == 'get') {
        type += ' ';
      }
      console.log('    >> ' + type + ': ' + msg.text);
    };

    return conv;
  };

  return {
    controller: controller,
    bot:        bot,
    testRunner: conversationTest(bot, controller),
    tryBlock: (block) => {
      var error;
      try {
        block();
      } catch (e) {
        error = e;
      }
      return error;
    }
  };
};

module.exports = {
  create: create
};