/**
 * This behavior will attempt to place the target item against the block at the target
 * position and given target block face. If the block could not be placed for any
 * reason, this behavior fails silently.
 *
 * Even if the block could not be placed, the target item is still equipped if possible.
 */

const {
  StateTransition,
  NestedStateMachine,
  BehaviorIdle,
  BehaviorMoveTo,
  goFarm
} = require("mineflayer-statemachine");
const BaseBehavior = require("./base_behavior");
const { BehaviorGotoGuild } = require("./go_guild")
const { Movements, goals: { GoalNear ,GoalLookAtBlock}} = require('mineflayer-pathfinder');
const Socket_schedule = require("./socket_schedule")
const Socket_chat = require("./socket_chat")
const mcData = require('minecraft-data')('1.16.5')

class craftBread extends BaseBehavior {

    constructor(bot, targets) {
        super(bot, 'craftBread', targets);
        this.working = true
    }
    async onStateEntered() {

        var name = 'bread'
        var amount = 1
        const defaultMove = new Movements(this.bot)
        const item = this.bot.registry.itemsByName[name]
        const craftingTableID = this.bot.registry.blocksByName.crafting_table.id

        const craftingTable = this.bot.findBlock({
          matching: craftingTableID
        })
        await this.sleepwait(3000)
        // await this.bot.pathfinder.goto(new GoalLookAtBlock(craftingTable.position, this.bot.world));
        if (item) {
          const recipe = this.bot.recipesFor(item.id, null, 1, craftingTable)[0]
          if (recipe) {
            this.bot.chat(`I can make ${name}`)
            try {
              await this.bot.craft(recipe, amount, craftingTable)
              this.bot.chat(`did the recipe for ${name} ${amount} times`)
            } catch (err) {
              this.bot.chat(`error making ${name}`)
            }
          } else {
            this.bot.chat(`I cannot make ${name}`)
          }
        } else {
          this.bot.chat(`unknown item: ${name}`)
        }

        
        var bread_position = this.bot.S_bread_position

        //await this.bot.pathfinder.setMovements(defaultMove)
        //await this.bot.pathfinder.setGoal(new GoalNear(bread_position.x, bread_position.y, bread_position.z, 1))
    
        // // console.log(this.bot.blockAt(bread_position))
        // // console.log(bread_position)
        await this.sleepwait(2000)
        var chest_window = await this.bot.openChest(this.bot.blockAt(bread_position));
        
        await this.sleepwait(2000)
        await this.depositItem(chest_window,'bread',1)
        await this.bot.closeWindow(chest_window)


        this.working = false
    }
    async withdrawItem (chest,name, amount) {
        const item = this.itemByName(chest.containerItems(), name)
        console.log(chest)
        if (item) {
          try {
            await this.sleepwait(1000)
            
            await chest.withdraw(item.type, null, amount)
            await this.sleepwait(2000)
           
            this.bot.chat(`withdrew ${amount} ${item.name}`)
          } catch (err) {
            this.bot.chat(`unable to withdraw ${amount} ${item.name}`)
          }
        } else {
          this.bot.chat(`unknown item ${name}`)
        }
    }
    async depositItem (chest,name, amount) {
        const item = this.itemByName(chest.items(), name)
        if (item) {
          try {
            await chest.deposit(item.type, null, amount)
            this.bot.chat(`deposited ${amount} ${item.name}`)
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
    async sleepwait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

    isFinished() {
        if(this.working){
          return false
        }else{
          return true
        }
      }
}

class FindWheatfromChest extends BaseBehavior {
  constructor(bot, targets) {
      super(bot, 'Equipseeds', targets);
      this.targets.unReachWaterCache = [];
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
        var target = chest_window.containerItems().filter(item => item.name.includes("wheat"))[0];
        await sleepwait(2000)
        if(target){
          await this.withdrawItem(chest_window,'wheat',3);
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


function have_wheat (bot) {
  var wheat = bot.registry.itemsByName['wheat'].id;
  if(bot.inventory.findInventoryItem(wheat)){
    if (bot.inventory.findInventoryItem(wheat).count >= 3)return true
    console.log("?")
    return false
  }
  console.log("???")
  return false
}

function JobCheck(check){
  if (check === true){
      return true
  }else{
      return false
  }
}

function createCraftBreadState(bot, targets) {
  const enter = new BehaviorIdle();
  const exit = new BehaviorIdle();    

  const goGuild = new BehaviorGotoGuild(bot, targets);
  const findWheat = new FindWheatfromChest(bot, targets);
  const craftbread = new craftBread(bot, targets);

  const socket_schedule = new Socket_schedule(bot,targets,"craft bread","wheat","5. go farm and search wheat from surrounding chest")
  const socket_chat = new Socket_chat(bot,targets,"wheat","I don't have the wheat, so I cant craft bread.")

  const transitions = [
    new StateTransition({
      parent: enter,
      child: goGuild,
      shouldTransition: () => true,
    }),
    new StateTransition({
      parent: goGuild,
      child: findWheat,
      shouldTransition: () => goGuild.isFinished() && JobCheck(goGuild.isFinished()) && !have_wheat(bot) == true,
    }),
    new StateTransition({
      parent: goGuild,
      child: craftbread,
      shouldTransition: () => goGuild.isFinished() && JobCheck(goGuild.isFinished()) && have_wheat(bot) == true,
    }),
    new StateTransition({
      parent: findWheat,
      child: craftbread,
      shouldTransition: () => findWheat.isFinished() && JobCheck(findWheat.isFinished()) && have_wheat(bot) == true,
    }),
    new StateTransition({
      parent: craftbread,
      child: exit,
      shouldTransition: () => craftbread.isFinished() && JobCheck(craftbread.isFinished()) == true,
    }),
    new StateTransition({
      parent: findWheat,
      child: socket_schedule,
      shouldTransition: () => findWheat.isFinished() && JobCheck(findWheat.isFinished()) && bot.agentState == 'schedule' && !have_wheat(bot) == true,
      onTransition: () => {
        bot.prev_jobs.push("find_wheat for crafting bread uncompleted")
        bot.miss_items.push("wheat")
      }
    }),
    new StateTransition({
      parent: findWheat,
      child: socket_chat,
      shouldTransition: () => findWheat.isFinished() && JobCheck(findWheat.isFinished()) && bot.agentState == 'chat' && !have_wheat(bot) == true,
      onTransition: () => {
        bot.chat("I didn't found wheat in chest");
      }
    }),
    new StateTransition({
      parent: socket_schedule,
      child: exit,
      shouldTransition: () => socket_schedule.isFinished() && JobCheck(socket_schedule.isFinished()) == true,
    }),
    new StateTransition({
      parent: socket_chat,
      child: exit,
      shouldTransition: () => socket_chat.isFinished(),
    })
  ]
  return new NestedStateMachine(transitions, enter, exit);
}
exports.createCraftBreadState = createCraftBreadState