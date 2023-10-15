const {
  StateTransition,
  NestedStateMachine,
  BehaviorIdle,
  BehaviorMoveTo
} = require("mineflayer-statemachine");
const BaseBehavior = require("./base_behavior");
const Socket_schedule = require("./socket_schedule")
const Socket_chat = require("./socket_chat")
const {Movements, goals: { GoalNear ,GoalLookAtBlock}} = require('mineflayer-pathfinder');
const { BehaviorGoFarm } = require("./go_farm");

const mcData = require('minecraft-data')('1.16.5')



// class BehaviorFindFarmLand extends BaseBehavior {
//   constructor(bot, targets) {
//       super(bot, 'FarmLand', targets);
//       this.targets.unReachWaterCache = [];

//   }
//   async onStateEntered() {
//       this.targets.entity = this.bot.findBlock({
//         point: this.bot.entity.position,
//         matching: mcData.itemsByName['farmland'].id,
//         maxDistance: 30,
//         useExtraInfo: (block) => {
//           const blockAbove = this.bot.blockAt(block.position.offset(0, 1, 0))
//           return !blockAbove || blockAbove.type === 0
//         }
//       });
//     }
// }

class BehaviorHarvest extends BaseBehavior {
  constructor(bot, targets) {
      super(bot, 'harvest', targets);
      this.working = false;
  }
  async onStateEntered() {
    this.working = true
    const target = this.bot.inventory.items().filter(item => item.name.includes("stone_hoe"))[0]
    this.bot.equip(target, "hand");
    while (1) {
      const toHarvest = await this.blockToHarvest(this.bot)
      if (toHarvest) {
        await this.move(toHarvest)
        await this.sleep(1500);
        await this.bot.dig(toHarvest)
        await this.sleep(1500);
      } else {
        break
      }
    }
    await this.sleep(1500);
    this.working = false;
  }

  async blockToHarvest (bot){
    return await bot.findBlock({
      point: bot.entity.position,
      maxDistance: 15,
      matching: (block) => {
        return block && block.type === mcData.blocksByName['wheat'].id && block.metadata === 7
      }
    })
  }
  async move (goal){
    const defaultMove = new Movements(this.bot)
    await this.bot.pathfinder.setMovements(defaultMove)
    await this.bot.pathfinder.setGoal(new GoalNear(goal.position.x, goal.position.y, goal.position.z, 2))
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

class FindHoefromChest extends BaseBehavior {
  constructor(bot, targets) {
      super(bot, 'EquipHoe', targets);
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

class putWheatBackToChest extends BaseBehavior {
  constructor(bot, targets) {
      super(bot, 'putWheatBackToChest', targets);
      this.working = true
  }
  async onStateEntered() {
      this.working = true
      const defaultMove = new Movements(this.bot)
      defaultMove.canDig = false
      var wheat_chest_position = this.bot.S_diedie_wheat_chest_position
      var wheat = mcData.itemsByName['wheat'].id;
      await sleepwait(2000)
      console.log("?????????????????")
      if(await this.bot.inventory.findInventoryItem(wheat)){
        console.log("????")
        await this.bot.pathfinder.setMovements(defaultMove)
        var wheat_number = await this.bot.inventory.findInventoryItem(wheat).count
        await this.bot.pathfinder.goto(new GoalLookAtBlock(wheat_chest_position, this.bot.world));
        await sleepwait(2000)
        var chest_window = await this.bot.openChest(this.bot.blockAt(wheat_chest_position));
        await sleepwait(2000)
        await this.depositItem(chest_window,'wheat',wheat_number);
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


function have_stone_hoe(bot){
  if(bot.inventory.items().filter(item => item.name.includes("stone_hoe"))[0])
    return true
  return false
}

function JobCheck(check){
  if (check === true){
      return true
  }else{
      return false
  }
}
function createHarvestState(bot, targets) {
  const enter = new BehaviorIdle();
  const exit = new BehaviorIdle();    
  // state
  const goFarm = new BehaviorGoFarm(bot, targets);
  const Harvest = new BehaviorHarvest(bot, targets);
  const wheatBack = new putWheatBackToChest(bot, targets);
  const find_hoe = new FindHoefromChest(bot, targets);  // item , observe' give you the wheat to make some bread'
  const socket_schedule = new Socket_schedule(bot,targets,"harvest the crops","stone_hoe","5. go farm and find stone_hoe")
  const socket_chat = new Socket_chat(bot,targets,"stone_hoe","I don't have the stone_hoe,so I can't harvest the wheat")
  const transitions = [
      new StateTransition({
          parent: enter,
          child: goFarm,
          shouldTransition: () => have_stone_hoe(bot),
      }),
      new StateTransition({
        parent: goFarm,
        child: Harvest,
        shouldTransition: () => goFarm.isFinished() && have_stone_hoe(bot) && JobCheck(goFarm.isFinished()) == true
      }),
      new StateTransition({
          parent: enter,
          child: find_hoe,
          shouldTransition: () => !have_stone_hoe(bot),
          onTransition: () => {
            bot.chat("No stone_hoe on my body");
        }
      }),
      new StateTransition({
          parent: Harvest,
          child: wheatBack,
          shouldTransition: () => Harvest.isFinished() && JobCheck(Harvest.isFinished()) == true,
          onTransition: () => {
            bot.chat("Harvest over");
            console.log("Harvest over")
          }
      }),
      new StateTransition({
        parent: wheatBack,
        child: exit,
        shouldTransition: () =>wheatBack.isFinished() && JobCheck(wheatBack.isFinished()) == true,
        onTransition: () => {
          bot.chat("all over");
          console.log("all over")
        }
    }),

      new StateTransition({
        parent: find_hoe,
        child: goFarm,
        shouldTransition: () => find_hoe.isFinished() && have_stone_hoe(bot) && JobCheck(find_hoe.isFinished()) == true,
        onTransition: () => {
          bot.chat("I found stone_hoe in chest");
        }
      }),
      new StateTransition({
          parent: find_hoe,
          child: socket_schedule,
          shouldTransition: () =>find_hoe.isFinished() && !have_stone_hoe(bot) && bot.agentState == 'schedule' && JobCheck(find_hoe.isFinished()) == true,
          onTransition: () => {
            bot.chat("I didn't found stone_hoe in chest");
          }
      }),

      new StateTransition({
          parent: find_hoe,
          child: socket_chat,
          shouldTransition: () => find_hoe.isFinished() && !have_stone_hoe(bot) && bot.agentState == 'chat' && JobCheck(find_hoe.isFinished()) == true,
          onTransition: () => {
            bot.chat("I didn't found stone_hoe in chest");
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

exports.createHarvestState = createHarvestState;



