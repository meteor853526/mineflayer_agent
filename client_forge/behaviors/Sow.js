const {
  StateTransition,
  NestedStateMachine,
  BehaviorIdle,
  BehaviorMoveTo
} = require("mineflayer-statemachine");
const BaseBehavior = require("./base_behavior");
const { BehaviorGoFarm } = require("./go_farm")
const Socket_schedule = require("./socket_schedule")
const Socket_chat = require("./socket_chat")
const {Movements, goals: { GoalNear ,GoalLookAtBlock}} = require('mineflayer-pathfinder')
const { Vec3 } = require('vec3')
const mcData = require('minecraft-data')('1.16.5')



class BehaviorFindFarmLand extends BaseBehavior {
  constructor(bot, targets) {
      super(bot, 'FarmLand', targets);
      this.working = true;
  }

  async onStateEntered() {
    this.working = true;

    const target = this.bot.inventory.items().filter(item => item.name.includes("wheat_seeds"))[0]
    this.bot.equip(target, "hand");
    while (1) {
      const toSow = await this.blockToSow(this.bot)
      console.log(toSow)
      if (toSow) {
        await this.move(toSow)
        await this.sleep(2500);
        await this.bot.placeBlock(toSow, new Vec3(0, 1, 0))
        await this.sleep(1500);
      } else {
        break
      }
    }
    await this.sleep(1500);
    this.working = false;
  }

  async blockToSow(bot){
    return await bot.findBlock({
      point: this.bot.entity.position,
      matching: mcData.blocksByName['farmland'].id,
      maxDistance: 30,
      useExtraInfo: (block) => {
        const blockAbove = this.bot.blockAt(block.position.offset(0, 1, 0))
        return !blockAbove || blockAbove.type === 0
      }
    })
  }
  async move (goal){
    const defaultMove = new Movements(this.bot)
    await this.bot.pathfinder.setMovements(defaultMove)
    await this.bot.pathfinder.setGoal(new GoalNear(goal.position.x, goal.position.y, goal.position.z, 3))
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  isFinished() {
    if(this.working){
      return false
    }else{
      return true
    }
  }
}

class FindWheatSeedsfromChest extends BaseBehavior {
  constructor(bot, targets) {
      super(bot, 'EquipWheat_Seeds', targets);
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
        var target = chest_window.containerItems().filter(item => item.name.includes("wheat_seeds"))[0];
        await sleepwait(2000)
        if(target){
          if(this.bot.inventory.items().filter(item => item.name.includes("wheat_seeds"))[0]){
            var seed_count  = this.bot.inventory.findInventoryItem(wheat_seeds).count
            if(seed_count > 32) break
          }
          var chest_seed = target.count
          await this.withdrawItem(chest_window,'wheat_seeds',chest_seed);
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

class putWheatSeedsBackToChest extends BaseBehavior {
  constructor(bot, targets) {
      super(bot, 'putWheatSeedsBackToChest', targets);
      this.working = true
  }
  async onStateEntered() {
      this.working = true
      var wheat_seeds_chest_position = this.bot.S_diedie_wheatSeed_chest_position
      var wheat_seeds = mcData.itemsByName['wheat_seeds'].id;
      await sleepwait(2000)
   
      if(await this.bot.inventory.findInventoryItem(wheat_seeds)){
    
        var wheat_seeds_number = await this.bot.inventory.findInventoryItem(wheat_seeds).count
        await this.bot.pathfinder.goto(new GoalLookAtBlock(wheat_seeds_chest_position, this.bot.world));
        await sleepwait(2000)
        var chest_window = await this.bot.openChest(this.bot.blockAt(wheat_seeds_chest_position));
        await sleepwait(2000)
        await this.depositItem(chest_window,'wheat_seeds',wheat_seeds_number);
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

var wheat_seeds = mcData.itemsByName['wheat_seeds'].id;
function have_wheat_seeds(bot){
  if(bot.inventory.items().filter(item => item.name.includes("wheat_seeds"))[0]){
    var seed_count  = bot.inventory.findInventoryItem(wheat_seeds).count
    if(seed_count > 32)return true
  }
  return false
}

function JobCheck(check){
  if (check === true){
      return true
  }else{
      return false
  }
}
function createSowState(bot, targets) {
  const enter = new BehaviorIdle();
  const exit = new BehaviorIdle();    
  // state
  const goFarm = new BehaviorGoFarm(bot, targets);
  const sow = new BehaviorFindFarmLand(bot, targets);
  const wheatSeedsBack = new putWheatSeedsBackToChest(bot, targets);
  const find_WheatSeeds = new FindWheatSeedsfromChest(bot, targets);  // item , observe' give you the wheat to make some bread'
  const socket_schedule = new Socket_schedule(bot,targets,"find wheat_seeds","wheat_seeds","5. go farm and search ' wheat_seeds' in surrounding chest")
  const socket_chat = new Socket_chat(bot,targets,"wheat_seeds","I don't have  wheat_seeds,so I can't sow the wheat")
  const transitions = [
      new StateTransition({
          parent: enter,
          child: goFarm,
          shouldTransition: () => have_wheat_seeds(bot),
      }),
      new StateTransition({
          parent: goFarm,
          child: sow,
          shouldTransition: () => goFarm.isFinished() && have_wheat_seeds(bot) && JobCheck(goFarm.isFinished()) == true,
      }),
      new StateTransition({
          parent: enter,
          child: find_WheatSeeds,
          shouldTransition: () => !have_wheat_seeds(bot),
          onTransition: () => {
            bot.chat("No wheat_seeds on my body");
        }
      }),
      new StateTransition({
          parent: sow,
          child: wheatSeedsBack,
          shouldTransition: () => sow.isFinished() && JobCheck(sow.isFinished()) == true,
          onTransition: () => {
            bot.chat("Sow over");
            bot.prev_jobs.push("Sow over")
            console.log("Sow over")
          }
      }),
      new StateTransition({
        parent: wheatSeedsBack,
        child: exit,
        shouldTransition: () =>wheatSeedsBack.isFinished() && JobCheck(wheatSeedsBack.isFinished()) == true,
        onTransition: () => {
          bot.chat("all over");
          console.log("all over")
        }
    }),

      new StateTransition({
        parent: find_WheatSeeds,
        child: goFarm,
        shouldTransition: () => find_WheatSeeds.isFinished() && have_wheat_seeds(bot) && JobCheck(find_WheatSeeds.isFinished()) == true,
        onTransition: () => {
          bot.chat("I found wheat_seeds in chest");
        }
      }),
      new StateTransition({
          parent: find_WheatSeeds,
          child: socket_schedule,
          shouldTransition: () =>find_WheatSeeds.isFinished() && !have_wheat_seeds(bot) && bot.agentState == 'schedule' && JobCheck(find_WheatSeeds.isFinished()) == true,
          onTransition: () => {
            bot.chat("I didn't found wheat_seeds in chest");
            bot.prev_jobs.push("find seeds for sowwing uncomplete")
            console.log("uncomplete sow find seeds")
          }
      }),

      new StateTransition({
          parent: find_WheatSeeds,
          child: socket_chat,
          shouldTransition: () => find_WheatSeeds.isFinished() && !have_wheat_seeds(bot) && bot.agentState == 'chat' && JobCheck(find_WheatSeeds.isFinished()) == true,
          onTransition: () => {
            // bot.chat("I didn't found wheat_seeds in chest");
          }
      }),
      new StateTransition({
          parent: socket_schedule,
          child: exit,
          shouldTransition: () => socket_schedule.isFinished(),
      }),
      new StateTransition({
        parent: socket_chat,
        child: exit,
        shouldTransition: () => socket_chat.isFinished(),
    }),
  ];

  return new NestedStateMachine(transitions, enter, exit);
}

exports.createSowState = createSowState;



