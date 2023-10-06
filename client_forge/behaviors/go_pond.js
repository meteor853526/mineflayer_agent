const mineflayer_pathfinder = require("mineflayer-pathfinder");
const minecraft_data = require("minecraft-data");

const BaseBehavior = require("./base_behavior");

class BehaviorGoPond extends BaseBehavior {
  constructor(bot, targets) {
    super(bot, 'goPond', targets);
    const mcData = minecraft_data(bot.version);
    this.movements = new mineflayer_pathfinder.Movements(bot, mcData);
    this.movements.canDig = false;
  }
  async onStateEntered() {
    if(!this.canStart())
      return;
    const pathfinder = this.bot.pathfinder;
    if(this.bot.username == "diedie"){
      var position = this.bot.Pond_position;
    }else{
      var position = this.bot.spawnPoint;
    }

    const goal = new mineflayer_pathfinder.goals.GoalNear(this.bot.Pond_position.x, this.bot.Pond_position.y, this.bot.Pond_position.z, 1);
    
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
        this.bot.chat("I don't have Pond!");
    }
    return position != null;
  }
}

exports.BehaviorGoPond = BehaviorGoPond;
