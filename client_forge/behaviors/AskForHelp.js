const {
  StateTransition,
  NestedStateMachine,
  BehaviorIdle,
  BehaviorMoveTo
} = require("mineflayer-statemachine");
const socketIOClient = require('socket.io-client');
const serverURL = 'http://localhost:3000'; 
const Socket_schedule = require("./socket_schedule")
const Socket_chat = require("./socket_chat")
const Socket_system = require("./socket_system")
const getWheather = require('../getRealtime.js').getWheather;
const getDistance = require('../getRealtime.js').getDistance;
const getRealtime = require("../getRealtime.js").getRealtime;
const BaseBehavior = require("./base_behavior");
// const mineflayer_pathfinder = require("mineflayer-pathfinder");
const {Movements, goals: { GoalNear ,GoalFollow}} = require('mineflayer-pathfinder')
const minecraft_data = require("minecraft-data");
const mcData = require('minecraft-data')('1.16.5')
const mineflayer_pathfinder = require("mineflayer-pathfinder");
class BehaviorAskForHelp extends BaseBehavior {
  constructor(bot, targets) {
    super(bot, 'BehaviorAskForHelp', targets);
    const mcData = minecraft_data(bot.version);
    this.working = true
  }
  async onStateEntered() {
    if(!this.canStart())
      return;
    const pathfinder = this.bot.pathfinder;
    const defaultMove = new Movements(this.bot)
    defaultMove.canDig = false

    const { username } = this.bot.nearestEntity(({ type }) => type === 'player')
    // console.log(username+"gogogogogogogogogogogogo")
    const socket = socketIOClient(serverURL);
    for (const [key, value] of Object.entries(this.bot.entities)) {
      if(value.type == 'player' && value.username == username) {
        socket.emit('message', {
          receiverName: this.bot.username,
          sender: username,
          type:'observe',
          observation: this.observation,
          message:"i was doing" + this.bot.prev_jobs + "and i miss 'wheat_seeds' and now i am walking to" + username + "asking for help.",
          time : getRealtime(this.bot.time.timeOfDay),
          wheather : getWheather(this.bot.isRaining),
          position:this.bot.pos,
          agentState:'askforhelp',
        })
        console.log(value.position.x +','+ value.position.y +','+ value.position.z)
        await this.bot.pathfinder.setMovements(defaultMove)
        await this.bot.pathfinder.setGoal(new GoalNear(value.position.x, value.position.y, value.position.z, 1))
      } else if(value.type == 'player' && username == "Guild") {
        this.bot.chat("go to find Guild and need help.")
        // value.position = this.bot.guild_position
        await this.bot.pathfinder.setMovements(defaultMove)
        await this.bot.pathfinder.setGoal(new GoalNear(this.bot.guild_position.x, this.bot.guild_position.y, this.bot.guild_position.z, 1))
      }
    } 
    await this.sleep(2000)
    // 從附近的所有生物篩選是玩家或NPC
    // 原先做法  1. 可以邊走邊找
    //          2. 只找固定範圍內的生物
    // 折衷作法: 直接找最近的NPC或玩家去尋求幫助
    //    ->依舊有個問題為如果玩家位置變動，可能抓取位置不準確
    // 走到Guild面前或找到玩家幫助就完成動作，同時發布任務 

    this.working = false
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isFinished() {
    const pathfinder = this.bot.pathfinder;
    return !pathfinder.isMoving() && this.working == false;
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

exports.BehaviorAskForHelp = BehaviorAskForHelp;

var target = null;

class BehaviorFindPlayer extends BaseBehavior {
  constructor(bot, targets) {
    super(bot, 'BehaviorFindPlayer', targets);
    const mcData = minecraft_data(bot.version);
    this.movements = new mineflayer_pathfinder.Movements(bot, mcData);
    this.movements.canDig = false;
  }
  async onStateEntered() {

    const player = this.bot.players['Jeff'] ? this.bot.players['Jeff'].entity : null;
    console.log(player)
    if (!player) {
        return;
    }
    const pathfinder = this.bot.pathfinder;
    pathfinder.setMovements(this.movements);
    
    await pathfinder.setGoal(new GoalFollow(player, 1), true);

    //pathfinder.goto(new GoalLookAtBlock(player.position, this.bot.world));
    
  }

  isFinished() {
    const pathfinder = this.bot.pathfinder;
    return !pathfinder.isMoving();
  }

}

class findTarget extends BaseBehavior {
  constructor(bot, targets) {
    super(bot, 'findTarget', targets);
    const mcData = minecraft_data(bot.version);
    this.movements = new mineflayer_pathfinder.Movements(bot, mcData);
    this.movements.canDig = false;
    this.working = true
  }
  async onStateEntered() {

    target = this.bot.players['Jeff'] ? this.bot.players['Jeff'].entity : null; // 先預設為Jeff    
     // bug 
    this.working = false
  }

  isFinished() {
    if(this.working){
      return false
    }else{
      return true
    }
  }

}
function JobCheck(check){
  if (check === true){
      return true
  }else{
      return false
  }
}
function have_target(){
  return target
}

function createAskForHelpState(bot, targets) {
  const enter = new BehaviorIdle();
  const exit = new BehaviorIdle();  

  const findPlayer = new BehaviorFindPlayer(bot,target);
  const Target = new findTarget(bot,target);
  const socket_system = new Socket_system(bot,targets,null,'Jeff')
  
  const transitions = [
    new StateTransition({
      parent: enter,
      child: Target,
      shouldTransition: () => true,
    }),
    new StateTransition({
      parent: Target,
      child: findPlayer,
      shouldTransition: () => Target.isFinished() && have_target() && JobCheck(Target.isFinished()) == true,
      onTransition: () =>{
        bot.chat("I found target")
      }
    }),
    new StateTransition({
      parent: Target,
      child: exit,
      shouldTransition: () => Target.isFinished() && !have_target() && JobCheck(Target.isFinished()) == true,
      onTransition: () =>{
        bot.chat("uh oh. there is no item i want here.")
      }
    }),
    new StateTransition({
      parent: findPlayer,
      child: socket_system,
      shouldTransition: () => findPlayer.isFinished() && JobCheck(findPlayer.isFinished()) == true,
    }),
    new StateTransition({
      parent: socket_system,
      child: exit,
      shouldTransition: () => socket_system.isFinished(),
      onTransition: () =>{
        console.log("----------------------------------------------------------------")
      }
    })
  ]
  return new NestedStateMachine(transitions, enter, exit);
}
exports.createAskForHelpState = createAskForHelpState;
