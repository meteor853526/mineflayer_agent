const {
  StateTransition,
  NestedStateMachine,
  BehaviorIdle,
  BehaviorMoveTo,
  sleep
} = require("mineflayer-statemachine");
const mineflayer_pathfinder = require("mineflayer-pathfinder");
const minecraft_data = require("minecraft-data");
const socketIOClient = require('socket.io-client');
const serverURL = 'http://localhost:3000'; 
const Socket_schedule = require("./socket_schedule")
const Socket_chat = require("./socket_chat")
const BaseBehavior = require("./base_behavior");
const mcData = require('minecraft-data')('1.16.5')
const { goals: { GoalLookAtBlock}} = require('mineflayer-pathfinder')
class BehaviorGoHome extends BaseBehavior {
  constructor(bot, targets) {
    super(bot, 'goHome', targets);
    const mcData = minecraft_data(bot.version);
    this.movements = new mineflayer_pathfinder.Movements(bot, mcData);
    this.movements.canDig = false;
  }
  async onStateEntered() {
    if(!this.canStart())
      return;
    const pathfinder = this.bot.pathfinder;
    if(this.bot.username == "diedie"){
      var position = this.bot.diedie_home_centerPos;
    }else{
      var position = this.bot.spawnPoint;
    }
    
    const goal = new mineflayer_pathfinder.goals.GoalNear(position.x, position.y, position.z, 1);
    
    pathfinder.setMovements(this.movements);
    pathfinder.setGoal(goal);
    this.bot.prev_jobs.push("go home")
    await this.sleep(2000)
  }
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  isFinished() {
    const pathfinder = this.bot.pathfinder;
    return !pathfinder.isMoving();
  }

  canStart() {
    const position = this.bot.spawnPoint;
    if (!position) {
      if(this.shouldComplain())
        this.bot.chat("I don't have home!");
    }
    return position != null;
  }
}

exports.BehaviorGoHome = BehaviorGoHome;
