const {
    StateTransition,
    NestedStateMachine,
    BehaviorIdle,
    BehaviorMoveTo
} = require("mineflayer-statemachine");
const BaseBehavior = require("./base_behavior");
const minecraft_data = require("minecraft-data");
const mcData = require('minecraft-data')('1.16.5')
const {Movements, goals: { GoalNear ,GoalLookAtBlock}} = require('mineflayer-pathfinder')
const Socket_schedule = require("./socket_schedule")
const socketIOClient = require('socket.io-client');
const serverURL = 'http://localhost:3000'; 
const socket = socketIOClient(serverURL);
const getRealtime = require("../getRealtime.js").getRealtime;
const getWheather = require('../getRealtime.js').getWheather;
const getDistance = require('../getRealtime.js').getDistance;
class findStone_pickaxe extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'findStone_pickaxe', targets);
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
          var target = chest_window.containerItems().filter(item => item.name.includes("stone_pickaxe"))[0];
          await sleepwait(2000)
          if(target){
            await this.withdrawItem(chest_window,'stone_pickaxe',1);
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
  function have_stone_pickaxe(bot){
    if(bot.inventory.items().filter(item => item.name.includes("stone_pickaxe"))[0])
      return true
    return false
  }

class Return_schedule extends BaseBehavior {
  constructor(bot, targets, current_job,requestItem,observation) {
      super(bot, 'update_requestList', targets);
      this.working = false
      this.requestItem = requestItem
      this.observation = observation
      this.current_job = current_job
  }

  async onStateEntered() {
    this.working = true
    socket.emit('message', {
      receiverName: this.bot.username,
      type:'observe',
      observation: this.observation,
      time : getRealtime(this.bot.time.timeOfDay),
      wheather : getWheather(this.bot.isRaining),
      position:this.bot.pos,
      agentState:'schedule_re',
      item_name:this.requestItem,
      prev_jobs: this.bot.prev_jobs,
      current_job: this.current_job,
    })
    this.working = false
  }
  isFinished() {
    return !this.working;
  }
}


  function createFindStone_pickaxe (bot, targets) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();

    const findPickaxe = new findStone_pickaxe(bot, targets);
    const socket_schedule = new Socket_schedule(bot,targets,"find stone_pickaxe"," stone_pickaxe","5. go to the smelter and search ' stone_pickaxe' from surrounding chest\n6. go to the smelter and craft 'stone_pickaxe'");
    const return_schedule = new Return_schedule(bot, targets, "find stone_pickaxe", "stone_pickaxe", "1. cut down tree\n2. mining");
    const transitions = [
      new StateTransition({
        parent: enter,
        child: findPickaxe,
        shouldTransition: () => true,
      }),
      new StateTransition({
        parent: findPickaxe,
        child: socket_schedule,
        shouldTransition: () => findPickaxe.isFinished() && !have_stone_pickaxe(bot) && JobCheck(findPickaxe.isFinished()) == true,
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
        parent: findPickaxe,
        child: return_schedule,
        shouldTransition: () => findPickaxe.isFinished() && have_stone_pickaxe(bot) && JobCheck(findPickaxe.isFinished()) == true,
        onTransition: () => {
          bot.chat("i found PICKAXE!!!")
        }
      }),
      new StateTransition({
        parent: return_schedule,
        child: exit,
        shouldTransition: () => return_schedule.isFinished() && JobCheck(return_schedule.isFinished()) == true,
        onTransition: () =>{
          console.log("return to origin schedule.")
        }
      })
    ]
    return new NestedStateMachine(transitions, enter, exit);
  }
  exports.createFindStone_pickaxe = createFindStone_pickaxe