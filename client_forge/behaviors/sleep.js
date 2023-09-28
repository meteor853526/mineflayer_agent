/**
 * This behavior will attempt to place the target item against the block at the target
 * position and given target block face. If the block could not be placed for any
 * reason, this behavior fails silently.
 *
 * Even if the block could not be placed, the target item is still equipped if possible.
 */
const mineflayer_pathfinder = require("mineflayer-pathfinder");
const minecraft_data = require("minecraft-data");
const BaseBehavior = require("./base_behavior");
const { Movements, goals: { GoalNear ,GoalLookAtBlock}} = require('mineflayer-pathfinder');
class sleepOnBed extends BaseBehavior {

    constructor(bot, targets) {
        super(bot, 'sleepOnBed', targets);
        this.working = true
        const mcData = minecraft_data(bot.version);
        this.movements = new mineflayer_pathfinder.Movements(bot, mcData);
        this.movements.canDig = false;
    }
    async onStateEntered() {
        const bed = this.bot.findBlock({
            matching: block => this.bot.isABed(block)
        })
        const pathfinder = this.bot.pathfinder;
        if(bed){
          var goal = new mineflayer_pathfinder.goals.GoalNear(bed.position.x, bed.position.y, bed.position.z, 1);
          pathfinder.setMovements(this.movements);
          pathfinder.setGoal(goal);
        }


        await this.sleepwait(2000)
        if (bed) {
          try {
            await this.bot.sleep(bed)
            this.bot.chat("I'm sleeping")
          } catch (err) {
            this.bot.chat(`I can't sleep: ${err.message}`)
          }
        } else {
          this.bot.chat('No nearby bed')
        }
        
        this.working = false
    }
    async sleepwait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    isFinished(){
        if(this.lock == true){
          return false
        }else{
          return true
    }    
}

}
exports.sleepOnBed = sleepOnBed;
