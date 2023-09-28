/**
 * This behavior will attempt to place the target item against the block at the target
 * position and given target block face. If the block could not be placed for any
 * reason, this behavior fails silently.
 *
 * Even if the block could not be placed, the target item is still equipped if possible.
 */

const BaseBehavior = require("./base_behavior");

class idleforsometime extends BaseBehavior {

    constructor(bot, targets) {
        super(bot, 'idleforsometime', targets);
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        var startTime = new Date().getTime(); 
          while(true){
            var currentTime = new Date().getTime();
            if (currentTime - startTime > 5000 ) { 
                break 
            }
            await this.sleep(2000)
        }
        this.working = false
    }
    isFinished(){
        if(this.working == true){
          return false
        }else{
          return true
        }
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}
exports.idleforsometime = idleforsometime;
