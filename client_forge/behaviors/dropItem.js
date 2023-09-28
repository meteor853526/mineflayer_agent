/**
 * This behavior will attempt to place the target item against the block at the target
 * position and given target block face. If the block could not be placed for any
 * reason, this behavior fails silently.
 *
 * Even if the block could not be placed, the target item is still equipped if possible.
 */

const BaseBehavior = require("./base_behavior");

class dropItem extends BaseBehavior {

    constructor(bot, targets) {
        super(bot, 'DropItem', targets);
    }
    async onStateEntered() {
        for (const item of this.bot.inventory.items()) {
            this.bot.tossStack(item);          
        }
    }
    isFinished() {
        if(his.bot.inventory.items().length == 0)return true
        return false
    }
    
    // canStart() {
    //     const position = this.bot.spawnPoint;
    //     if (!position) {
    //       if(this.shouldComplain())
    //         this.bot.chat("I have nothing !");
    //     }
    //     return position != null;
    // }
}
exports.dropItem = dropItem;
