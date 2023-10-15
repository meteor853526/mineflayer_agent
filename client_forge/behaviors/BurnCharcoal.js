const {
    StateTransition,
    NestedStateMachine,
    BehaviorIdle,
    BehaviorMoveTo
  } = require("mineflayer-statemachine");
  const BaseBehavior = require("./base_behavior");
  const Socket_schedule = require("./socket_schedule")
  const Socket_chat = require("./socket_chat")
  const {Movements, goals: { GoalNear ,GoalLookAtBlock, GoalBlock}} = require('mineflayer-pathfinder');
const { BehaviorGoLoggingCamp } = require("./go_loggingCamp");
  
  const mcData = require('minecraft-data')('1.16.5')
  
  
  class BehaviorBurnCharcoal extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'BurnCharcoal', targets);
        this.working = false;
    }
    async onStateEntered() {
        this.working = true
        var furnace_position = this.bot.furnace_position
        const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
        await this.bot.pathfinder.setMovements(defaultMove)
        await this.bot.pathfinder.goto(new GoalNear(furnace_position.x, furnace_position.y, furnace_position.z, 1))
        this.bot.chat(mcData.blocksByName.furnace.id);
        const furnaceBlock = this.bot.findBlock({
            matching: mcData.blocksByName.furnace.id,
            maxDistance: 32,
        })
        // console.log(furnaceBlock)
        await this.bot.pathfinder.setGoal(new GoalLookAtBlock(furnaceBlock.position, this.bot.world))
        this.bot.chat("arrived!")
        await sleep(1000)
        // var furnace = this.bot.openFurnace(furnaceBlock);
        const furnace = await this.bot.openFurnace(furnaceBlock)
        let output = ''
        output += `input: ${furnace.inputItem()}, `
        output += `fuel: ${furnace.fuelItem()}, `
        output += `output: ${furnace.outputItem()}`
        console.log(output)

        putInFurnace('fuel', 'oak_planks', 1, this.bot)
        await sleep(2000)
        putInFurnace('input', 'oak_log', 1, this.bot)
        await sleep(15000) // 30 ticks per charcoal
        takeFromFurnace('output', this.bot)
        await sleep(2000)
        furnace.on('close', () => {
            this.bot.chat('furnace closed')
        })
        async function putInFurnace (where, name, amount, bot) {
            const item = itemByName(furnace.items(), name)
            if (item) {
            const fn = {
                input: furnace.putInput,
                fuel: furnace.putFuel
            }[where]
            // console.log("fn: "+fn)
            try {
                await fn.call(furnace, item.type, null, amount)
                bot.chat(`put ${amount} ${item.name}`)
            } catch (err) {
                bot.chat(`unable to put ${amount} ${item.name}`)
            }
            } else {
                bot.chat(`unknown item ${name}`)
            }
        }
        
        async function takeFromFurnace (what, bot) {
            const fn = {
            input: furnace.takeInput,
            fuel: furnace.takeFuel,
            output: furnace.takeOutput
            }[what]
            try {
            const item = await fn.call(furnace)
            bot.chat(`took ${item.name}`)
            } catch (err) {
            bot.chat('unable to take')
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
  }
  
  class FindLogfromChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'EquipLog', targets);
        this.targets.unReachWaterCache = [];
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const chest_id = mcData.blocksByName['chest'].id;

        const defaultMove = new Movements(this.bot)
        await this.bot.pathfinder.setMovements(defaultMove)
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
        while(chests.length !== 0) {
          var chest = chests.shift()
          
          await this.bot.pathfinder.setGoal(new GoalLookAtBlock(chest, this.bot.world));
          await sleepwait(2000)
          var chest_window = await this.bot.openChest(this.bot.blockAt(chest));
          await sleepwait(2000)
          var target = chest_window.containerItems().filter(item => item.name.includes("oak_log"))[0];
          await sleepwait(2000)
          if(target){
            await this.withdrawItem(chest_window,'oak_log',1);
            await sleepwait(2000)
            await this.bot.closeWindow(chest_window)
            break;
          }
          await this.bot.closeWindow(chest_window)
          await sleepwait(1000)
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

  class FindPlankfromChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'EquipPlank', targets);
        this.targets.unReachWaterCache = [];
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const chest_id = mcData.blocksByName['chest'].id;

        const defaultMove = new Movements(this.bot)
        await this.bot.pathfinder.setMovements(defaultMove)
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
        while(chests.length !== 0) {
          var chest = chests.shift()
          
          await this.bot.pathfinder.setGoal(new GoalLookAtBlock(chest, this.bot.world));
          await sleepwait(2000)
          var chest_window = await this.bot.openChest(this.bot.blockAt(chest));
          await sleepwait(2000)
          var target = chest_window.containerItems().filter(item => item.name.includes("oak_planks"))[0];
          await sleepwait(2000)
          if(target){
            await this.withdrawItem(chest_window,'oak_planks',1);
            await sleepwait(2000)
            await this.bot.closeWindow(chest_window)
            break;
          }
          await this.bot.closeWindow(chest_window)
          await sleepwait(1000)
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
  
  class putAllBackToChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'putAllBackToChest', targets);
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        var coal_chest_position = this.bot.coal_chest_position
        // var oak_log = mcData.itemsByName['oak_log'].id;
        await sleep(2000)
        var allitems = []
        await this.bot.inventory.items().forEach(items =>{
            allitems.push({name:items.name,count:items.count})
        })
            console.log("????")
            await this.bot.pathfinder.goto(new GoalLookAtBlock(coal_chest_position, this.bot.world));
            await sleep(2000)
            var chest_window = await this.bot.openChest(this.bot.blockAt(coal_chest_position));
            await sleep(2000)
            await Inchest(this.bot,allitems,chest_window)
            await sleep(2000)
            await this.bot.closeWindow(chest_window)
        // }
        async function Inchest(bot,allitems,chest_window){

            while(allitems.length != 0){
              let item = allitems.pop()
              await sleep(2000)
              await depositItem(item.name,item.count,bot,chest_window)
            }
            
        }
        async function depositItem (name, amount,bot,chest) {
            const item = itemByName(chest.items(), name)
            if (item) {
                try {
                await sleep(1000)
                await chest.deposit(item.type, null, amount)
                await sleep(1000)
                bot.chat(`deposited ${amount} ${item.name}`)
                } catch (err) {
                bot.chat(`unable to deposit ${amount} ${item.name}`)
                }
            } else {
                bot.chat(`unknown item ${name}`)
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
        async function sleep(ms) {
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
  
  
  function have_log(bot){
    if(bot.inventory.items().filter(item => item.name.includes("oak_log"))[0])
      return true
    return false
  }
  function have_planks(bot){
    if(bot.inventory.items().filter(item => item.name.includes("oak_planks"))[0])
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
  function createBurnCharcoalState(bot, targets) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();    
    // state
    const go_loggingCamp = new BehaviorGoLoggingCamp(bot, targets);
    const BurnCharcoal = new BehaviorBurnCharcoal(bot, targets);
    const allBack = new putAllBackToChest(bot, targets);
    const findLog = new FindLogfromChest(bot, targets);  // item , observe' give you the wheat to make some bread'
    const findPlanks = new FindPlankfromChest(bot, targets);
    const socket_schedule_log = new Socket_schedule(bot,targets,"find oak_log","oak_log","5. go to loggingCamp and find oak_log")
    const socket_chat_log = new Socket_chat(bot,targets,"oak_log","I don't have oak_log, so I can't burn a charcoal")
    const socket_schedule_planks = new Socket_schedule(bot,targets,"find oak_planks","oak_planks","5. go to loggingCamp and find oak_planks")
    const socket_chat_planks = new Socket_chat(bot,targets,"oak_planks","I don't have oak_planks, so I can't burn a charcoal")
    const transitions = [
        new StateTransition({
          parent: enter,
          child: go_loggingCamp,
          shouldTransition: () => true,
        }),
        new StateTransition({
            parent: go_loggingCamp,
            child: findLog,
            shouldTransition: () => !have_log(bot) && go_loggingCamp.isFinished() && JobCheck(go_loggingCamp.isFinished()) == true,
            onTransition: () => {
                bot.chat("No oak_log on my body");
            }
        }),
        new StateTransition({
            parent: go_loggingCamp,
            child: findPlanks,
            shouldTransition: () => !have_planks(bot) && go_loggingCamp.isFinished() && JobCheck(go_loggingCamp.isFinished()) == true,
            onTransition: () => {
              bot.chat("No oak_planks on my body");
          }
        }),
        new StateTransition({
            parent: go_loggingCamp,
            child: BurnCharcoal,
            shouldTransition: () => have_planks(bot) && have_log(bot) && go_loggingCamp.isFinished() && JobCheck(go_loggingCamp.isFinished()) == true,
        }),
        new StateTransition({
            parent: findLog,
            child: findPlanks,
            shouldTransition: () => !have_planks(bot) && have_log(bot) && findLog.isFinished() && JobCheck(findLog.isFinished()) == true,
            onTransition: () => {
              bot.chat("No oak_planks on my body");
          }
        }),
        new StateTransition({
            parent: findPlanks,
            child: findLog,
            shouldTransition: () => !have_log(bot) && have_planks(bot),
            onTransition: () => {
              bot.chat("No oak_log on my body");
          }
        }),
        new StateTransition({
            parent: findLog,
            child: BurnCharcoal,
            shouldTransition: () => have_log(bot) && have_planks(bot) && findLog.isFinished() && JobCheck(findLog.isFinished()) == true,
            onTransition: () => {
                bot.chat("Burning Charcoal");
                console.log("Burning Charcoal")
              }
        }),
        new StateTransition({
            parent: findPlanks,
            child: BurnCharcoal,
            shouldTransition: () => have_log(bot) && have_planks(bot),
            onTransition: () => {
                bot.chat("Burning Charcoal");
                console.log("Burning Charcoal")
              }
        }),
        new StateTransition({
            parent: BurnCharcoal,
            child: allBack,
            shouldTransition: () => BurnCharcoal.isFinished() && JobCheck(BurnCharcoal.isFinished()) == true,
            onTransition: () => {
              bot.chat("BurnCharcoal over");
              bot.prev_jobs.push("BurnCharcoal Finished")
              console.log("BurnCharcoal over")
            }
        }),
        new StateTransition({
          parent: allBack,
          child: exit,
          shouldTransition: () =>allBack.isFinished() && JobCheck(allBack.isFinished()) == true,
          onTransition: () => {
            bot.chat("all over");
            console.log("all over")
          }
      }),
  
        new StateTransition({
          parent: findLog,
          child: BurnCharcoal,
          shouldTransition: () => findLog.isFinished() && have_log(bot) && JobCheck(findLog.isFinished()) == true,
          onTransition: () => {
            bot.chat("I found oak_log in chest");
          }
        }),
        new StateTransition({
            parent: findLog,
            child: socket_schedule_log,
            shouldTransition: () =>findLog.isFinished() && !have_log(bot) && bot.agentState == 'schedule' && JobCheck(findLog.isFinished()) == true,
            onTransition: () => {
              bot.prev_jobs.push("find oak_log for burning charcoal uncompleted")
              bot.miss_items.push("oak_log")
              bot.chat("I didn't found oak_log in chest");
            }
        }),
  
        new StateTransition({
            parent: findLog,
            child: socket_chat_log,
            shouldTransition: () =>findLog.isFinished() && !have_log(bot) && bot.agentState == 'chat' && JobCheck(findLog.isFinished()) == true,
            onTransition: () => {
              bot.chat("I didn't found oak_log in chest");
            }
        }),
        new StateTransition({
            parent: findPlanks,
            child: socket_schedule_planks,
            shouldTransition: () =>findPlanks.isFinished() && !have_planks(bot) && bot.agentState == 'schedule' && JobCheck(findPlanks.isFinished()) == true,
            onTransition: () => {
              bot.prev_jobs.push("find oak_planks for burning charcoal uncompleted")
              bot.miss_items.push("oak_planks")
              bot.chat("I didn't found oak_planks in chest");
            }
        }),
  
        new StateTransition({
            parent: findPlanks,
            child: socket_chat_planks,
            shouldTransition: () =>findPlanks.isFinished() && !have_planks(bot) && bot.agentState == 'chat' && JobCheck(findPlanks.isFinished()) == true,
            onTransition: () => {
              bot.chat("I didn't found oak_planks in chest");
            }
        }),
        new StateTransition({
            parent: socket_schedule_log,
            child: exit,
            shouldTransition: () => socket_schedule_log.isFinished(),
        }),
        new StateTransition({
          parent: socket_chat_log,
          child: exit,
          shouldTransition: () => socket_chat_log.isFinished(),
        }),
        new StateTransition({
            parent: socket_schedule_planks,
            child: exit,
            shouldTransition: () => socket_schedule_planks.isFinished(),
        }),
        new StateTransition({
          parent: socket_chat_planks,
          child: exit,
          shouldTransition: () => socket_chat_planks.isFinished(),
        }),
    ];
  
    return new NestedStateMachine(transitions, enter, exit);
  }
  
  exports.createBurnCharcoalState = createBurnCharcoalState;
  
  
  
  