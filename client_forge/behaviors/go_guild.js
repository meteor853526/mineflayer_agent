const mineflayer_pathfinder = require("mineflayer-pathfinder");
const minecraft_data = require("minecraft-data");

const BaseBehavior = require("./base_behavior");

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
    const pathfinder = this.bot.pathfinder;

    var position = this.bot.guild_position
    const goal = new mineflayer_pathfinder.goals.GoalNear(position.x, position.y, position.z, 1);
    
    pathfinder.setMovements(this.movements);
    pathfinder.setGoal(goal);

    this.working = false
  }

  isFinished() {
    const pathfinder = this.bot.pathfinder;
    return !pathfinder.isMoving() && this.working;
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

exports.BehaviorGotoGuild = BehaviorGotoGuild;
