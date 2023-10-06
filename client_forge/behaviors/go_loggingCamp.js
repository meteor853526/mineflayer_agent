const mineflayer_pathfinder = require("mineflayer-pathfinder");
const minecraft_data = require("minecraft-data");

const BaseBehavior = require("./base_behavior");

class BehaviorGoLoggingCamp extends BaseBehavior {
  constructor(bot, targets) {
    super(bot, 'goLoggingCamp', targets);
    const mcData = minecraft_data(bot.version);
    this.movements = new mineflayer_pathfinder.Movements(bot, mcData);
    this.movements.canDig = false;
  }
  async onStateEntered() {
    if(!this.canStart())
      return;
    const pathfinder = this.bot.pathfinder;
    if(this.bot.username == "diedie"){
      var position = this.bot.forest;
    }else{
      var position = this.bot.spawnPoint;
    }

    const goal = new mineflayer_pathfinder.goals.GoalNear(this.bot.forest.x, this.bot.forest.y, this.bot.forest.z, 1);
    
    pathfinder.setMovements(this.movements);
    pathfinder.setGoal(goal);
  }

  isFinished() {
    const pathfinder = this.bot.pathfinder;
    return !pathfinder.isMoving();
  }

  canStart() {
    const position = this.bot.spawnPoint;
    if (!position) {
      if(this.shouldComplain())
        this.bot.chat("I don't have LoggingCamp!");
    }
    return position != null;
  }
}

exports.BehaviorGoLoggingCamp = BehaviorGoLoggingCamp;
