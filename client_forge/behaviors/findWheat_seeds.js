const {
    StateTransition,
    NestedStateMachine,
    BehaviorIdle,
    BehaviorMoveTo
} = require("mineflayer-statemachine");
const BaseBehavior = require("./base_behavior");
const Socket_schedule = require("./socket_schedule")
const minecraft_data = require("minecraft-data");
const mcData = require('minecraft-data')('1.16.5')
const {Movements, goals: { GoalNear ,GoalLookAtBlock}} = require('mineflayer-pathfinder')
class findWheat_seeds extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'findWheat_seeds', targets);
        this.working = true
    }
    async onStateEntered() {
        this.working = true

        const chest_id = mcData.blocksByName['chest'].id;
        var chests = this.bot.findBlocks({
          matching: function(block) {
            // Get a single side of double-chests, and all single chests.
            return block.type === chest_id && (block.getProperties().type === 'single' || block.getProperties().type === 'right')
          },
          useExtraInfo: true,
          maxDistance: 15,
          count: 50
        });
        while(chests.length !== 0) {
          var chest = chests.shift()
  
          await this.bot.pathfinder.goto(new GoalLookAtBlock(chest, this.bot.world));
          await sleepwait(2000)
          var chest_window = await this.bot.openChest(this.bot.blockAt(chest));
          await sleepwait(2000)
          var target = chest_window.containerItems().filter(item => item.name.includes("wheat_seeds"))[0];
          await sleepwait(2000)
          if(target){
            await this.withdrawItem(chest_window,'wheat_seeds',1);
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
  function have_wheat_seeds(bot){
    if(bot.inventory.items().filter(item => item.name.includes("wheat_seeds"))[0])
      return true
    return false
  }
  function createFindWheat_seeds (bot, targets) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();

    const findSeeds = new findWheat_seeds(bot, targets);
    const socket_schedule = new Socket_schedule(bot,targets,"find wheat_seeds"," wheat_seeds","I don't find the wheat_seeds");

    const transitions = [
      new StateTransition({
        parent: enter,
        child: findSeeds,
        shouldTransition: () => true,
      }),
      new StateTransition({
        parent: findSeeds,
        child: socket_schedule,
        shouldTransition: () => findSeeds.isFinished() && !have_wheat_seeds(bot) && JobCheck(findSeeds.isFinished()) == true,
        onTransition: () => {
          bot.prev_jobs.push("find wheat_seeds")
        }
      }),
      new StateTransition({
        parent: socket_schedule,
        child: exit,
        shouldTransition: () => socket_schedule.isFinished() && JobCheck(socket_schedule.isFinished()) == true,
        onTransition: () => {
          bot.chat('let me think what i do next')
        }
      }),
      new StateTransition({
        parent: findSeeds,
        child: exit,
        shouldTransition: () => findSeeds.isFinished() && have_wheat_seeds(bot) && JobCheck(findSeeds.isFinished()) == true,
        onTransition: () => {
          bot.chat("i found seeds!!!")
        }
      }),
    ]
    return new NestedStateMachine(transitions, enter, exit);
  }
  // exports.findWheat_seeds = findWheat_seeds;
  exports.createFindWheat_seeds = createFindWheat_seeds