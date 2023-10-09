const {
  StateTransition,
  NestedStateMachine,
  BehaviorIdle,
  BehaviorMoveTo
} = require("mineflayer-statemachine");
const BaseBehavior = require("./base_behavior");
const socketIOClient = require('socket.io-client');
const serverURL = 'http://localhost:3000'; 
const Socket_schedule = require("./socket_schedule")
const Socket_chat = require("./socket_chat")
const {BehaviorGotoGuild} = require("./go_guild")
const {BehaviorGoHome} = require("./go_home")
const {Movements, goals: { GoalNear ,GoalLookAtBlock}} = require('mineflayer-pathfinder')
const getWheather = require('../getRealtime.js').getWheather;
const getDistance = require('../getRealtime.js').getDistance;
const getRealtime = require("../getRealtime.js").getRealtime;
const relocate = require("../getRealtime.js").relocate;
const mcData = require('minecraft-data')('1.16.5')


class BehaviorFeedChicken extends BaseBehavior {
  constructor(bot, targets) {
      super(bot, 'feedChicken', targets);
      this.working = false;
  }
  async onStateEntered() {
    this.working = true
    const defaultMove = new Movements(this.bot)
    defaultMove.canDig = false
    var wheat_seeds = this.bot.registry.itemsByName['wheat_seeds'].id;
    var wheatSeed_chest_position = this.bot.S_diedie_wheatSeed_chest_position
    var chest_window
    var chest
    var count_todo = 1
    
    
    while(count_todo == 1){
      // holding
      if (this.bot.inventory.findInventoryItem(wheat_seeds)) {
          let destination = 'hand';
          console.log("holding wheat_seeds")
          console.log(this.bot.inventory.findInventoryItem(wheat_seeds).count)
          // this.bot.equip(wheat_seeds, destination).then(() => {
          //     this.equipItemCallback();
          // });
          const target = this.bot.inventory.items().filter(item => item.name.includes("wheat_seeds"))[0]
          this.bot.equip(target, "hand");
          // }).catch(err => {
          //     console.log("I need more wheat_seeds!!!")
          //     this.equipItemCallback(err);
          // });

          await this.bot.pathfinder.setMovements(defaultMove)
          await this.bot.pathfinder.setGoal(new GoalNear(this.bot.PoultryFarm_position.x, this.bot.PoultryFarm_position.y, this.bot.PoultryFarm_position.z, 1))
          await sleep(2000)
          // click
          for (const [key, value] of Object.entries(this.bot.entities)) {
              //console.log(key, value);
              if(value.name == 'chicken'){
                  await this.bot.lookAt(value.position)
                  await this.bot.activateEntity(value);
                  await sleep(1000)
                }
          }
          count_todo = 0
          // console.log("count_todo: " + count_todo + "~~~!!!!!!!!")
        }
      }

      
      function itemByName (items, name) {
          let item
          let i
          for (i = 0; i < items.length; ++i) {
            item = items[i]
           
            if (item && item.name === name) return item
          }
          return null
        }
      async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
    this.working = false;
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
  equipItemCallback(err) {
      if (__1.globalSettings.debugMode && err != null) {
          console.log(err);
      }
      this.wasEquipped = err !== undefined;
  }
}

class FindwheatseedsfromChest extends BaseBehavior {
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
        var target = chest_window.containerItems().filter(item => item.name.includes("wheat_seeds"))[0];
        await sleepwait(2000)
        if(target){
          await this.withdrawItem(chest_window,'wheat_seeds',12);
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
      var wheatSeed_chest_position = this.bot.S_diedie_wheatSeed_chest_position
      var wheat_seeds = mcData.itemsByName['wheat_seeds'].id;
      await sleepwait(2000)
      console.log("?????????????????")
      if(await this.bot.inventory.findInventoryItem(wheat_seeds)){
        console.log("????")
        var wheat_seeds_number = await this.bot.inventory.findInventoryItem(wheat_seeds).count
        await this.bot.pathfinder.setGoal(new GoalLookAtBlock(wheatSeed_chest_position, this.bot.world));
        await sleepwait(2000)
        var chest_window = await this.bot.openChest(this.bot.blockAt(wheatSeed_chest_position));
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

// class GoGuild extends BaseBehavior{
//   constructor(bot, targets) {
//     super(bot, 'goGuild', targets);
//     this.working = false;
// }
//   async onStateEntered(){
//     this.working = true
//     const defaultMove = new Movements(this.bot)
//     defaultMove.canDig = false
//       //const { x: playerX, y: playerY, z: playerZ } = target.position

//       // this.bot.entities.forEach(element => {
//       //   console.log(element)
//       // });
//       for (const [key, value] of Object.entries(this.bot.entities)) {
//         //console.log(key, value);
//         if(value.username == 'Guild'){
//           console.log("find guild")
//           await this.bot.pathfinder.setMovements(defaultMove)
//           await this.bot.pathfinder.setGoal(new GoalNear(value.position.x,value.position.y,value.position.z, 1))
//           await this.bot.lookAt(value.position)
//           await this.bot.activateEntity(value);
//           await this.bot.activateEntity(value);
//         }
//       }
//       const socket = socketIOClient(serverURL);
//       socket.emit('message', {
//         targetSocketId: 'TARGET_SOCKET_ID',
//         current_job:"go to Guild find missing item",
//         sender:"Lili",
//         receiverName: this.bot.username,
//         time:getRealtime(this.bot.time.timeOfDay),
//         wheather:getWheather(this.bot.isRaining),
//         position:this.bot.pos,
//         type:"schedule",
//         item_name:"wheat_seeds",
//         prev_jobs: this.bot.prev_jobs,
//       });
//       this.working = false
//   }
//   isFinished() {
//     if(this.working){
//       return false
//     }else{
//       return true
//     }
//   }
// }

function have_wheat_seeds(bot){
  if(bot.inventory.items().filter(item => item.name.includes("wheat_seeds"))[0])
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
function createFeedChickenState(bot, targets) {
  const enter = new BehaviorIdle();
  const exit = new BehaviorIdle();    
  // state
  const feedChicken = new BehaviorFeedChicken(bot, targets);
  const wheatBack = new putWheatBackToChest(bot, targets);
  const find_wheat_seeds = new FindwheatseedsfromChest(bot, targets);  // item , observe' give you the wheat to make some bread'
  // const goGuild = new BehaviorGotoGuild(bot, targets);
  // const goGuild = new GoGuild(bot, targets);
  // const goHome = new BehaviorGoHome(bot, targets);
  const socket_schedule = new Socket_schedule(bot,targets,"feed chicken","wheat_seeds","I don't have the wheat_seeds")
  const socket_chat = new Socket_chat(bot,targets,"wheat_seeds","I don't have the wheat_seeds,so I cant feed chickens.")
  const transitions = [
      new StateTransition({
          parent: enter,
          child: feedChicken,
          shouldTransition: () => have_wheat_seeds(bot),
      }),
      new StateTransition({
          parent: enter,
          child: find_wheat_seeds,
          shouldTransition: () => !have_wheat_seeds(bot),
          onTransition: () => {
            bot.chat("No wheat_seeds on my body");
        }
      }),
      new StateTransition({
          parent: feedChicken,
          child: wheatBack,
          shouldTransition: () => feedChicken.isFinished() && JobCheck(feedChicken.isFinished()) == true,
          onTransition: () => {
            bot.chat("feedChicken over");
            console.log("feedChicken over")
            bot.prev_jobs.push("feedChicken Over")
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
        parent: find_wheat_seeds,
        child: feedChicken,
        shouldTransition: () => find_wheat_seeds.isFinished() && have_wheat_seeds(bot) && JobCheck(find_wheat_seeds.isFinished()) == true,
        onTransition: () => {
          bot.chat("I found wheat_seeds in chest");
          bot.prev_jobs.push("find_wheat_seeds for feed chicken completed")
        }
      }),
      new StateTransition({
        parent: find_wheat_seeds,
        child: socket_schedule,
        shouldTransition: () =>find_wheat_seeds.isFinished() && !have_wheat_seeds(bot) && bot.agentState == 'schedule' && JobCheck(find_wheat_seeds.isFinished()) == true,
        onTransition: () => {
          bot.prev_jobs.push("find_wheat_seeds for feed chicken uncompleted")
          bot.miss_items.push("wheat_seeds")
          bot.chat("I didn't found wheat_seeds, and i also helpless now.");
        }
      }),
      new StateTransition({
        parent: find_wheat_seeds,
        child: socket_chat,
        shouldTransition: () =>find_wheat_seeds.isFinished() && !have_wheat_seeds(bot) && bot.agentState == 'chat' && JobCheck(find_wheat_seeds.isFinished()) == true,
        onTransition: () => {
          bot.chat("I didn't found wheat_seeds in chest");
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

exports.createFeedChickenState = createFeedChickenState;



