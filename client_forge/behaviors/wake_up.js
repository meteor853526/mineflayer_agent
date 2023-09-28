/**
 * This behavior will attempt to place the target item against the block at the target
 * position and given target block face. If the block could not be placed for any
 * reason, this behavior fails silently.
 *
 * Even if the block could not be placed, the target item is still equipped if possible.
 */

const BaseBehavior = require("./base_behavior");

class wakeUpFromBed extends BaseBehavior {

    constructor(bot, targets) {
        super(bot, 'wakeUpFromBed', targets);
        this.working = true
    }
    async onStateEntered() {
      try {
        await this.bot.wake()
      } catch (err) {
        this.bot.chat(`I can't wake up: ${err.message}`)
      }
        this.working = false
    }
    isFinished(){
        if(this.lock == true){
          return false
        }else{
          return true
    }    
}

}
exports.wakeUpFromBed = wakeUpFromBed;
