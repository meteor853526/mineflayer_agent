/**
 * This behavior will attempt to place the target item against the block at the target
 * position and given target block face. If the block could not be placed for any
 * reason, this behavior fails silently.
 *
 * Even if the block could not be placed, the target item is still equipped if possible.
 */
const serverURL = 'http://localhost:3000'; 
const socketIOClient = require('socket.io-client');
const socket = socketIOClient(serverURL);
const BaseBehavior = require("./base_behavior");
const getRealtime = require("../getRealtime.js").getRealtime;
const getWheather = require('../getRealtime.js').getWheather;
const getDistance = require('../getRealtime.js').getDistance;

class eat extends BaseBehavior {

    constructor(bot, targets) {
        super(bot, 'eat', targets);
        this.working = true
        this.requestItem = "food"
        this.observation = "I don't have food"
    }
    async onStateEntered() {
        const foodItem = this.bot.inventory.items().find(item => item.name.includes('bread'))
        if(foodItem){
            await this.bot.equip(foodItem,'hand')
            await this.sleepwait(3000)
      
            this.bot.activateItem()
            await this.sleepwait(1000)
        }else{
            console.log("no bread")
            socket.emit('message', {
                receiverName: this.bot.username,
                type:'observe',
                observation: this.observation,
                time : getRealtime(this.bot.time.timeOfDay),
                wheather : getWheather(this.bot.isRaining),
                position:this.bot.pos,
                agentState:this.bot.agentState,
                item_name:this.requestItem
            })
        }

        this.working = false
    }
    async sleepwait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    isFinished(){
        if(this.working == true){
          return false
        }else{
          return true
        }
    }
}
exports.eat = eat;
