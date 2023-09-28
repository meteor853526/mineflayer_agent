

const BaseBehavior = require("./base_behavior");
const socketIOClient = require('socket.io-client');
const serverURL = 'http://localhost:3000'; 
const socket = socketIOClient(serverURL);
const getRealtime = require("../getRealtime.js").getRealtime;
const getWheather = require('../getRealtime.js').getWheather;
const getDistance = require('../getRealtime.js').getDistance;



class Socket_chat extends BaseBehavior {
    constructor(bot, targets,requestItem,observation) {
        super(bot, 'ask player for help', targets);
        this.working = false
        this.requestItem = requestItem
        this.observation = observation
    }
  
    async onStateEntered() {
      this.working = true
      socket.emit('message', {
        receiverName: this.bot.username,
        sender : this.bot.current_talker,
        type : 'observe',
        message: this.observation,
        time : getRealtime(this.bot.time.timeOfDay),
        wheather : getWheather(this.bot.isRaining),
        position:this.bot.pos,
        agentState:this.bot.agentState,
      })
      this.working = false
    }
    async isFinished() {
      return !this.working;
    }
}

module.exports = Socket_chat;