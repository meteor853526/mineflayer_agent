const mineflayer_pathfinder = require("mineflayer-pathfinder");
const minecraft_data = require("minecraft-data");
const { pathfinder, Movements, goals: {GoalFollow,GoalLookAtBlock}} = require('mineflayer-pathfinder')
const BaseBehavior = require("./base_behavior");

class BehaviorFollowPlayer extends BaseBehavior {
  constructor(bot, targets) {
    super(bot, 'BehaviorFollowPlayer', targets);
    const mcData = minecraft_data(bot.version);
    this.movements = new mineflayer_pathfinder.Movements(bot, mcData);
    this.movements.canDig = false;
  }
  async onStateEntered() {

    const player = this.bot.players[this.bot.current_talker] ? this.bot.players[this.bot.current_talker].entity : null;
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


//this.bot.current_talker
exports.BehaviorFollowPlayer = BehaviorFollowPlayer;
