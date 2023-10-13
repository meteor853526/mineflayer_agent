const {
    StateTransition,
    NestedStateMachine,
    BehaviorIdle,
    BehaviorMoveTo
} = require("mineflayer-statemachine");
const BaseBehavior = require("./base_behavior");
const minecraft_data = require("minecraft-data");
const mcData = require('minecraft-data')('1.16.5')
const Socket_schedule = require("./socket_schedule")
const {Movements, goals: { GoalNear ,GoalLookAtBlock}} = require('mineflayer-pathfinder')
class findStone_hoe extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'findStone_hoe', targets);
        this.working = true
    }
    async onStateEntered() {
        this.working = true

        const chest_id = mcData.blocksByName['chest'].id;
        await sleepwait(2000)
        var chests = this.bot.findBlocks({
          matching: function(block) {
            // Get a single side of double-chests, and all single chests.
            return block.type === chest_id && (block.getProperties().type === 'single' || block.getProperties().type === 'right')
          },
          useExtraInfo: true,
          maxDistance: 15,
          count: 50
        });
        console.log(chests)
        while(chests.length !== 0) {
          var chest = chests.shift()
  
          await this.bot.pathfinder.goto(new GoalLookAtBlock(chest, this.bot.world));
          await sleepwait(2000)
          var chest_window = await this.bot.openChest(this.bot.blockAt(chest));
          await sleepwait(2000)
          var target = chest_window.containerItems().filter(item => item.name.includes("stone_hoe"))[0];
          await sleepwait(2000)
          if(target){
            await this.withdrawItem(chest_window,'stone_hoe',1);
            await sleepwait(2000)
            await this.bot.closeWindow(chest_window)
            break;
          }
          await this.bot.closeWindow(chest_window)
        }
        async function sleepwait(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));  
        }
  
        this.working = false
    }
    isFinished() {
      if(this.working){
        return false
      }else{
        return true
      }
    }
    async withdrawItem (chest,name, amount) {
      const item = this.itemByName(chest.containerItems(), name)
      console.log(chest)
      if (item) {
        try {
          await this.sleep(1000)
          
          await chest.withdraw(item.type, null, amount)
          await this.sleep(2000)
         
          this.bot.chat(`withdrew ${amount} ${item.name}`)
        } catch (err) {
          this.bot.chat(`unable to withdraw ${amount} ${item.name}`)
        }
      } else {
        this.bot.chat(`unknown item ${name}`)
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

  function JobCheck(check){
    if (check === true){
        return true
    }else{
        return false
    }
  }
  function have_stone_hoe(bot){
    if(bot.inventory.items().filter(item => item.name.includes("stone_hoe"))[0])
      return true
    return false
  }
  exports.findStone_hoe = findStone_hoe;

  function createFindHoeState(bot, targets) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();  
  
    
    const findStone_hoefromChest = new  findStone_hoe(bot, targets);
    //const socket_schedule = new Socket_schedule(bot,targets,"go home",bot.miss_items[bot.miss_items.length-1],"I don't find the wheat_seeds")
    const socket_schedule = new Socket_schedule(bot,targets,"stone_hoe","You didn't find any stone_hoe in these chest.",null)
    // const socket_chat = new Socket_chat(bot,targets,"wheat_seeds","I don't have the wheat_seeds,so I cant feed chickens.")
  
    const transitions = [
      new StateTransition({
        parent: enter,
        child: findStone_hoefromChest,
        shouldTransition: () => true,
      }),
      new StateTransition({
        parent: findStone_hoefromChest,
        child: exit,
        shouldTransition: () => findStone_hoefromChest.isFinished() && have_stone_hoe(bot) && JobCheck(findStone_hoefromChest.isFinished()) == true,
        onTransition: () =>{
          bot.chat("I found stone_hoe in the chest.")
        }
      }),
      new StateTransition({
        parent: findStone_hoefromChest,
        child: socket_schedule,
        shouldTransition: () => findStone_hoefromChest.isFinished() && !have_stone_hoe(bot) && JobCheck(findStone_hoefromChest.isFinished()) == true,
        onTransition: () =>{
          bot.chat("uh oh. there is no item i want here.")
        }
      }),
      new StateTransition({
        parent: socket_schedule,
        child: exit,
        shouldTransition: () => socket_schedule.isFinished(),
        onTransition: () =>{
          console.log("----------------------------------------------------------------")
        }
      })
    ]
    return new NestedStateMachine(transitions, enter, exit);
  }
  exports.createFindHoeState = createFindHoeState;
