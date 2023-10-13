const {
  StateTransition,
  NestedStateMachine,
  BehaviorIdle,
  BehaviorMoveTo,
  sleep
} = require("mineflayer-statemachine");
const mineflayer_pathfinder = require("mineflayer-pathfinder");
const minecraft_data = require("minecraft-data");
const BaseBehavior = require("./base_behavior");
const mcData = require('minecraft-data')('1.16.5')
const { Movements, goals: { GoalLookAtBlock, GoalNear, GoalFollow}} = require('mineflayer-pathfinder')
class BehaviorGotoGuild extends BaseBehavior {
  constructor(bot, targets) {
    super(bot, 'BehaviorGotoGuild', targets);
    const mcData = minecraft_data(bot.version);
    this.movements = new mineflayer_pathfinder.Movements(bot, mcData);
    this.movements.canDig = false;
    this.working = true
  }
  async onStateEntered() {
    if(!this.canStart())
      return;
 
    const position = this.bot.guild_position
    const pathfinder = this.bot.pathfinder;

    const goal = new mineflayer_pathfinder.goals.GoalNear(position.x, position.y, position.z, 1);



    pathfinder.setMovements(this.movements)
    pathfinder.setGoal(goal)
    // console.log(this.bot.players['Guild'].entity.position)
    // this.bot.prev_jobs.push("go Guild")
    this.working = false
  }
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  isFinished() {
    const pathfinder = this.bot.pathfinder;
    return !pathfinder.isMoving() && !this.working;
  }
  // isFinished() {
  //   return !this.working;
  // }

  canStart() {
    const position = this.bot.spawnPoint;
    if (!position) {
      if(this.shouldComplain())
        this.bot.chat("I don't have home!");
    }
    return position != null;
  }
}

exports.BehaviorGotoGuild = BehaviorGotoGuild;
// exports.createGotoGuildState = createGotoGuildState;
