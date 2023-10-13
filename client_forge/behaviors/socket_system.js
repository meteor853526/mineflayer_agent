

const BaseBehavior = require("./base_behavior");
const socketIOClient = require('socket.io-client');
const serverURL = 'http://localhost:3000'; 
const socket = socketIOClient(serverURL);
const getRealtime = require("../getRealtime.js").getRealtime;
const getWheather = require('../getRealtime.js').getWheather;
const getDistance = require('../getRealtime.js').getDistance;
const getlocate = require('../getRealtime.js').relocate;
const playerdistance = require("../getRealtime.js").playerdistance;

class Socket_system extends BaseBehavior {
    constructor(bot, targets, requestItem,targetAgentName) {
        super(bot, 'Socket_system', targets);
        this.working = false
        this.requestItem = requestItem
        this.targetAgent = targetAgentName
    }

  
    async onStateEntered() {
      this.working = true
      socket.emit('message', {
        receiverName: this.bot.username,
        type:'system',
        time : getRealtime(this.bot.time.timeOfDay),
        message: 'system:help',
        wheather : getWheather(this.bot.isRaining),
        position: getlocate(this.bot),
        targetAgent:this.targetAgent,
        playerdistance: playerdistance(this.bot,'Jeff'),
      })
      this.working = false
    }
    isFinished() {
      return !this.working;
    }
}

module.exports = Socket_system;