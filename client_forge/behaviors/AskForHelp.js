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
  const BaseBehavior = require("./base_behavior");
  // const mineflayer_pathfinder = require("mineflayer-pathfinder");
  const {Movements, goals: { GoalNear ,GoalLookAtBlock}} = require('mineflayer-pathfinder')
  const minecraft_data = require("minecraft-data");
  const mcData = require('minecraft-data')('1.16.5')
  
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
  
      for (const [key, value] of Object.entries(this.bot.entities)) {
        if(value.type == 'player' && value.username == username) {
          this.bot.chat("I need Guild help.")
          await this.bot.pathfinder.setMovements(defaultMove)
          await this.bot.pathfinder.setGoal(new GoalNear(value.position.x, value.position.y, value.position.z, 1))
        } else if(value.type == 'player' && username == "Guild") {
          this.bot.chat("go to find Guild and need help.")
          await this.bot.pathfinder.setMovements(defaultMove)
          await this.bot.pathfinder.setGoal(new GoalNear(value.position.x, value.position.y, value.position.z, 1))
        }
      } 
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