

const {
    StateTransition,
    NestedStateMachine,
    BehaviorIdle,
    BehaviorMoveTo
  } = require("mineflayer-statemachine");
  const BaseBehavior = require("./base_behavior");
  const Socket_schedule = require("./socket_schedule")
  const Socket_chat = require("./socket_chat")
  const {Movements, goals: { GoalNear ,GoalLookAtBlock}} = require('mineflayer-pathfinder')
  
  const mcData = require('minecraft-data')('1.16.5')

class putToolBackToChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'putToolBackToChest', targets);
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        if(this.bot.username == 'diedie'){
            var position = this.bot.diedie_stone_hoe_pos
            var tool = 'stone_hoe';
        }


        await sleepwait(2000)
     
        if(await this.bot.inventory.findInventoryItem(tool)){
      
          await this.bot.pathfinder.goto(new GoalLookAtBlock(position, this.bot.world));
          await sleepwait(2000)
          var chest_window = await this.bot.openChest(this.bot.blockAt(position));
          await sleepwait(2000)
          await this.depositItem(chest_window,'stone_hoe',1);
          await sleepwait(2000)
          await this.bot.closeWindow(chest_window)
        }
        
        async function sleepwait(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
        this.working = false
    }
    async depositItem (chest,name, amount) {
      const item = this.itemByName(chest.items(), name)
      if (item) {
        try {
          await chest.deposit(item.type, null, amount)
          bot.chat(`deposited ${amount} ${item.name}`)
        } catch (err) {
          //bot.chat(`unable to deposit ${amount} ${item.name}`)
        }
      } else {
        //bot.chat(`unknown item ${name}`)
      }
    }
    isFinished() {
      if(this.working){
        return false
      }else{
        return true
      }
    }
    itemByName (items, name) {
      let item
      let i
      for (i = 0; i < items.length; ++i) {
        item = items[i]
        if (item && item.name === name) return item
      }
      return null
    }
    
    async sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
 }
 exports.putToolBackToChest = putToolBackToChest;