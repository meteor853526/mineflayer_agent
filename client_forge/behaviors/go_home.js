const {
  StateTransition,
  NestedStateMachine,
  BehaviorIdle,
  BehaviorMoveTo
} = require("mineflayer-statemachine");
const mineflayer_pathfinder = require("mineflayer-pathfinder");
const minecraft_data = require("minecraft-data");
const socketIOClient = require('socket.io-client');
const serverURL = 'http://localhost:3000'; 
const Socket_schedule = require("./socket_schedule")
const Socket_chat = require("./socket_chat")
const BaseBehavior = require("./base_behavior");
const mcData = require('minecraft-data')('1.16.5')
const { goals: { GoalLookAtBlock}} = require('mineflayer-pathfinder')
class BehaviorGoHome extends BaseBehavior {
  constructor(bot, targets) {
    super(bot, 'goHome', targets);
    const mcData = minecraft_data(bot.version);
    this.movements = new mineflayer_pathfinder.Movements(bot, mcData);
    this.movements.canDig = false;
  }
  async onStateEntered() {
    if(!this.canStart())
      return;
    const pathfinder = this.bot.pathfinder;
    if(this.bot.username == "diedie"){
      var position = this.bot.diedie_home_centerPos;
    }else{
      var position = this.bot.spawnPoint;
    }
    
    const goal = new mineflayer_pathfinder.goals.GoalNear(position.x, position.y, position.z, 1);
    
    pathfinder.setMovements(this.movements);
    pathfinder.setGoal(goal);
  }

  isFinished() {
    const pathfinder = this.bot.pathfinder;
    return !pathfinder.isMoving();
  }

  canStart() {
    const position = this.bot.spawnPoint;
    if (!position) {
      if(this.shouldComplain())
        this.bot.chat("I don't have home!");
    }
    return position != null;
  }
}

// exports.BehaviorGoHome = BehaviorGoHome;


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
function createGoHomeState(bot, targets) {
  const enter = new BehaviorIdle();
  const exit = new BehaviorIdle();  

  const goHome = new BehaviorGoHome(bot, targets);
  const findwheatseedsfromChest = new  FindwheatseedsfromChest(bot, targets);
  //const socket_schedule = new Socket_schedule(bot,targets,"go home",bot.miss_items[bot.miss_items.length-1],"I don't find the wheat_seeds")
  const socket_schedule = new Socket_schedule(bot,targets,"go home"," wheat_seeds","I don't find the wheat_seeds")
  // const socket_chat = new Socket_chat(bot,targets,"wheat_seeds","I don't have the wheat_seeds,so I cant feed chickens.")

  const transitions = [
    new StateTransition({
      parent: enter,
      child: goHome,
      shouldTransition: () => true,
    }),
    new StateTransition({
      parent: goHome,
      child:  findwheatseedsfromChest,
      shouldTransition: () => goHome.isFinished() && JobCheck(goHome.isFinished()) == true,
    }),
    new StateTransition({
      parent: findwheatseedsfromChest,
      child: exit,
      shouldTransition: () => findwheatseedsfromChest.isFinished() && have_wheat_seeds(bot) && JobCheck(findwheatseedsfromChest.isFinished()) == true,
    }),
    new StateTransition({
      parent: findwheatseedsfromChest,
      child: socket_schedule,
      shouldTransition: () => findwheatseedsfromChest.isFinished() && !have_wheat_seeds(bot) && JobCheck(findwheatseedsfromChest.isFinished()) == true,
      onTransition: () =>{
        bot.prev_jobs.push("go home and find_wheat_seeds")
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
exports.createGoHomeState = createGoHomeState;
