

const BaseBehavior = require("./base_behavior");
const socketIOClient = require('socket.io-client');
const serverURL = 'http://localhost:3000'; 
const socket = socketIOClient(serverURL);
const getRealtime = require("../getRealtime.js").getRealtime;
const getWheather = require('../getRealtime.js').getWheather;
const getDistance = require('../getRealtime.js').getDistance;



class Socket_schedule extends BaseBehavior {
    constructor(bot, targets, current_job,requestItem,observation) {
        super(bot, 'update_requestList', targets);
        this.working = false
        this.requestItem = requestItem
        this.observation = observation
        this.current_job = current_job
    }
  
    async onStateEntered() {
      this.working = true
      socket.emit('message', {
        receiverName: this.bot.username,
        type:'observe',
        observation: this.observation,
        time : getRealtime(this.bot.time.timeOfDay),
        wheather : getWheather(this.bot.isRaining),
        position:this.bot.pos,
        agentState:'schedule',
        item_name:this.requestItem,
        prev_jobs: this.bot.prev_jobs,
        current_job: this.current_job,
      })
      this.working = false
    }
    isFinished() {
      return !this.working;
    }
}

module.exports = Socket_schedule;