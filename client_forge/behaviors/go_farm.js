const mineflayer_pathfinder = require("mineflayer-pathfinder");
const minecraft_data = require("minecraft-data");

const BaseBehavior = require("./base_behavior");

class BehaviorGoFarm extends BaseBehavior {
  constructor(bot, targets) {
    super(bot, 'goFarm', targets);
    const mcData = minecraft_data(bot.version);
    this.movements = new mineflayer_pathfinder.Movements(bot, mcData);
    this.movements.canDig = false;
  }
  async onStateEntered() {
    if(!this.canStart())
      return;
    const pathfinder = this.bot.pathfinder;
    if(this.bot.username == "diedie"){
      var position = this.bot.diedie_farm_centerPos;
    }else{
      var position = this.bot.spawnPoint;
    }

   /* async onStateEntered() {
      this.lock = true
      const defaultMove = new Movements(this.bot)

      //const { x: playerX, y: playerY, z: playerZ } = target.position

      await this.bot.pathfinder.setMovements(defaultMove)
      await this.bot.pathfinder.setGoal(new GoalNear(this.bot.diedie_farm_centerPos.x, this.bot.diedie_farm_centerPos.y, this.bot.diedie_farm_centerPos.z, 1))
      this.lock = false
  }*/

    const goal = new mineflayer_pathfinder.goals.GoalNear(this.bot.diedie_farm_centerPos.x, this.bot.diedie_farm_centerPos.y, this.bot.diedie_farm_centerPos.z, 1);
    
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
        this.bot.chat("I don't have Farm!");
    }
    return position != null;
  }
}

exports.BehaviorGoFarm = BehaviorGoFarm;
