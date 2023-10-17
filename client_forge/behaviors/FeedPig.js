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
  
  
  class BehaviorFeedPig extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'feedPig', targets);
        this.working = false;
    }
    async onStateEntered() {
      this.working = true
      const defaultMove = new Movements(this.bot)
      defaultMove.canDig = false
      var carrot = this.bot.registry.itemsByName['carrot'].id;
      var carrot_chest_position = this.bot.carrot_chest_position
      var chest_window
      var chest
      var count_todo = 1
      
      
      while(count_todo == 1){
        // holding
        if (this.bot.inventory.findInventoryItem(carrot)) {
            let destination = 'hand';
            console.log("holding carrot")
            console.log(this.bot.inventory.findInventoryItem(carrot).count)
            // this.bot.equip(wheat_seeds, destination).then(() => {
            //     this.equipItemCallback();
            // });
            const target = this.bot.inventory.items().filter(item => item.name.includes("carrot"))[0]
            this.bot.equip(target, "hand");
            // }).catch(err => {
            //     console.log("I need more wheat_seeds!!!")
            //     this.equipItemCallback(err);
            // });

            await this.bot.pathfinder.setMovements(defaultMove)
            await this.bot.pathfinder.setGoal(new GoalNear(this.bot.Pigpen_position.x, this.bot.Pigpen_position.y, this.bot.Pigpen_position.z, 1))
            await sleep(2000)
            // click
            for (const [key, value] of Object.entries(this.bot.entities)) {
                //console.log(key, value);
                if(value.name == 'pig'){
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
  
  class FindcarrotfromChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'Equipcarrot', targets);
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
            var target = chest_window.containerItems().filter(item => item.name.includes("carrot"))[0];
            await sleepwait(2000)
            if(target){
                await this.withdrawItem(chest_window,'carrot',12);
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
    async withdrawItem (chest, name, amount) {
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
  
  class putCarrotBackToChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'putCarrotBackToChest', targets);
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        var carrot_chest_position = this.bot.carrot_chest_position
        var carrot = mcData.itemsByName['carrot'].id;
        await sleepwait(2000)
        console.log("?????????????????")
        if(await this.bot.inventory.findInventoryItem(carrot)){
          console.log("????")
          var carrot_number = await this.bot.inventory.findInventoryItem(carrot).count
          await this.bot.pathfinder.goto(new GoalLookAtBlock(carrot_chest_position, this.bot.world));
          await sleepwait(2000)
          var chest_window = await this.bot.openChest(this.bot.blockAt(carrot_chest_position));
          await sleepwait(2000)
          await this.depositItem(chest_window,'carrot',carrot_number);
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
  
  
  function have_carrot(bot){
    if(bot.inventory.items().filter(item => item.name.includes("carrot"))[0])
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
  function createFeedPigState(bot, targets) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();    
    // state
    const feedPig = new BehaviorFeedPig(bot, targets);
    const carrotBack = new putCarrotBackToChest(bot, targets);
    const find_carrot = new FindcarrotfromChest(bot, targets);  // item , observe' give you the wheat to make some bread'
    const socket_schedule = new Socket_schedule(bot,targets,"find carrot"," carrot","5. go to farm and search carrot from surrounding\n6. go pigpen and search carrot from surrounding chest");
    const socket_chat = new Socket_chat(bot,targets,"carrot","I don't have the carrot,so I cant feed pigs.")
    const transitions = [
        new StateTransition({
            parent: enter,
            child: feedPig,
            shouldTransition: () => have_carrot(bot),
        }),
        new StateTransition({
            parent: enter,
            child: find_carrot,
            shouldTransition: () => !have_carrot(bot),
            onTransition: () => {
              bot.chat("No carrot on my body");
          }
        }),
        new StateTransition({
            parent: feedPig,
            child: carrotBack,
            shouldTransition: () => feedPig.isFinished() && JobCheck(feedPig.isFinished()) == true,
            onTransition: () => {
              bot.chat("feedPig over");
              console.log("feedPig over")
            }
        }),
        new StateTransition({
          parent: carrotBack,
          child: exit,
          shouldTransition: () =>carrotBack.isFinished() && JobCheck(carrotBack.isFinished()) == true,
          onTransition: () => {
            bot.chat("all over");
            console.log("all over")
          }
      }),
  
        new StateTransition({
          parent: find_carrot,
          child: feedPig,
          shouldTransition: () => find_carrot.isFinished() && have_carrot(bot) && JobCheck(find_carrot.isFinished()) == true,
          onTransition: () => {
            bot.chat("I found carrot in chest");
          }
        }),
        new StateTransition({
            parent: find_carrot,
            child: socket_schedule,
            shouldTransition: () =>find_carrot.isFinished() && !have_carrot(bot) && bot.agentState == 'schedule' && JobCheck(find_carrot.isFinished()) == true,
            onTransition: () => {
              bot.prev_jobs.push("find carrot for feed pig uncompleted")
              bot.miss_items.push("carrot")
              bot.chat("I didn't found carrot in chest");
            }
        }),
  
        new StateTransition({
            parent: find_carrot,
            child: socket_chat,
            shouldTransition: () => find_carrot.isFinished() && !have_carrot(bot) && bot.agentState == 'chat' && JobCheck(find_carrot.isFinished()) == true,
            onTransition: () => {
              bot.chat("I didn't found carrot in chest");
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
  
  exports.createFeedPigState = createFeedPigState;
  
  
  
  