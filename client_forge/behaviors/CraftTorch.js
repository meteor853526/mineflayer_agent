const {
    StateTransition,
    NestedStateMachine,
    BehaviorIdle,
    BehaviorMoveTo
  } = require("mineflayer-statemachine");
  const BaseBehavior = require("./base_behavior");
  const Socket_schedule = require("./socket_schedule")
  const Socket_chat = require("./socket_chat")
  const {BehaviorGoSmeltingPlant} = require("./go_smeltingPlant")
  const {Movements, goals: { GoalNear ,GoalLookAtBlock, GoalBlock}} = require('mineflayer-pathfinder');
  
  const mcData = require('minecraft-data')('1.16.5')
  
  
  class BehaviorCraftTorch extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'CraftTorch', targets);
        this.working = false;
    }
    async onStateEntered() {
        this.working = true
        var name = 'torch'
        var amount = 1
        const item = this.bot.registry.itemsByName[name]
        const craftingTableID = this.bot.registry.blocksByName.crafting_table.id

        const craftingTable = this.bot.findBlock({
            matching: craftingTableID
        })
        await this.bot.pathfinder.goto(new GoalLookAtBlock(craftingTable.position, this.bot.world));
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
  
  class FindStickfromChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'EquipStick', targets);
        this.targets.unReachWaterCache = [];
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const chest_id = mcData.blocksByName['chest'].id;

        const defaultMove = new Movements(this.bot)
        await this.bot.pathfinder.setMovements(defaultMove)
        await this.bot.pathfinder.setGoal(new GoalNear(2263, 63, -2927, 0))
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
          var target = chest_window.containerItems().filter(item => item.name.includes("stick"))[0];
          await sleepwait(2000)
          if(target){
            await this.withdrawItem(chest_window,'stick',1);
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

  class FindCoalfromChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'EquipCoal', targets);
        this.targets.unReachWaterCache = [];
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const chest_id = mcData.blocksByName['chest'].id;

        const defaultMove = new Movements(this.bot)
        await this.bot.pathfinder.setMovements(defaultMove)
        await this.bot.pathfinder.setGoal(new GoalNear(2263, 63, -2927, 0))
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
          var target = chest_window.containerItems().filter(item => item.name.includes("coal"))[0];
          await sleepwait(2000)
          if(target){
            await this.withdrawItem(chest_window,'coal',1);
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
  class FindCharcoalfromChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'EquipCharcoal', targets);
        this.targets.unReachWaterCache = [];
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const chest_id = mcData.blocksByName['chest'].id;

        const defaultMove = new Movements(this.bot)
        await this.bot.pathfinder.setMovements(defaultMove)
        await this.bot.pathfinder.setGoal(new GoalNear(2263, 63, -2927, 0))
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
          var target = chest_window.containerItems().filter(item => item.name.includes("charcoal"))[0];
          await sleepwait(2000)
          if(target){
            await this.withdrawItem(chest_window,'charcoal',1);
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
        var stick_chest_position = this.bot.stick_chest_position
        // var spruce_log = mcData.itemsByName['spruce_log'].id;
        await sleep(2000)
        var allitems = []
        await this.bot.inventory.items().forEach(items =>{
            allitems.push({name:items.name,count:items.count})
        })
        // console.log("?????????????????")
        // if(await this.bot.inventory.findInventoryItem(spruce_log)){
            console.log("????")
            // var log_number = await this.bot.inventory.findInventoryItem(spruce_log).count
            await this.bot.pathfinder.goto(new GoalLookAtBlock(stick_chest_position, this.bot.world));
            await sleep(2000)
            var chest_window = await this.bot.openChest(this.bot.blockAt(stick_chest_position));
            await sleep(2000)
        //   await this.depositItem(chest_window,'spruce_log',log_number);
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
  
  
  function have_stick(bot){
    if(bot.inventory.items().filter(item => item.name.includes("stick"))[0])
      return true
    return false
  }
  function have_coal(bot){
    if(bot.inventory.items().filter(item => item.name.includes("coal"))[0])
      return true
    return false
  }
  function have_charcoal(bot){
    if(bot.inventory.items().filter(item => item.name.includes("charcoal"))[0])
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
  function createCraftTorchState(bot, targets) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();    
    // state
    const go_smeltingPlant = new BehaviorGoSmeltingPlant(bot, targets);
    const CraftTorch = new BehaviorCraftTorch(bot, targets);
    const allBack = new putAllBackToChest(bot, targets);
    const findStick = new FindStickfromChest(bot, targets);  // item , observe' give you the wheat to make some bread'
    const findCoal = new FindCoalfromChest(bot, targets);
    const findCharcoal = new FindCharcoalfromChest(bot, targets);
    const socket_schedule_coal = new Socket_schedule(bot,targets,"find coal", "coal", "5. go to the smelter and search coal from surrounding chest\n")
    const socket_chat_coal = new Socket_chat(bot,targets,"find coal", "coal","I don't have the coal,so I can't make a torch")
    const socket_schedule_stick = new Socket_schedule(bot,targets,"find stick","stick","5. go to the smelter and search coal from surrounding chest")
    const socket_chat_stick = new Socket_chat(bot,targets,"stick","I don't have the stick,so I can't make a torch")
    const transitions = [
        new StateTransition({
          parent: enter,
          child: go_smeltingPlant,
          shouldTransition: () => true,
        }), 
        new StateTransition({
            parent: go_smeltingPlant,
            child: findCoal,
            shouldTransition: () => !have_coal(bot) && go_smeltingPlant.isFinished() && JobCheck(go_smeltingPlant.isFinished()) == true,
            onTransition: () => {
                bot.chat("No coal on my body");
            }
        }),
        new StateTransition({
            parent: go_smeltingPlant,
            child: findStick,
            shouldTransition: () => !have_stick(bot) && go_smeltingPlant.isFinished() && JobCheck(go_smeltingPlant.isFinished()) == true,
            onTransition: () => {
              bot.chat("No stick on my body");
          }
        }),
        new StateTransition({
            parent: findStick,
            child: findCoal,
            shouldTransition: () => !have_coal(bot) && have_stick(bot),
            onTransition: () => {
              bot.chat("No coal on my body");
          }
        }),
        new StateTransition({
            parent: findCoal,
            child: findStick,
            shouldTransition: () => !have_stick(bot) && have_coal(bot),
            onTransition: () => {
              bot.chat("No stick on my body");
          }
        }),
        new StateTransition({
            parent: findStick,
            child: CraftTorch,
            shouldTransition: () => have_stick(bot) && have_coal(bot),
        }),
        new StateTransition({
            parent: findCoal,
            child: CraftTorch,
            shouldTransition: () => have_stick(bot) && (have_coal(bot)||have_charcoal(bot)),
        }),
        new StateTransition({
            parent: CraftTorch,
            child: allBack,
            shouldTransition: () => CraftTorch.isFinished() && JobCheck(CraftTorch.isFinished()) == true,
            onTransition: () => {
              bot.chat("CraftTorch over");
              bot.prev_jobs.push("CraftTorch Finished")
              console.log("CraftTorch over")
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
          parent: findCoal,
          child: CraftTorch,
          shouldTransition: () => findCoal.isFinished() && have_coal(bot) && JobCheck(findCoal.isFinished()) == true,
          onTransition: () => {
            bot.chat("I found coal in chest");
          }
        }),
        new StateTransition({
            parent: findStick,
            child: socket_schedule_stick,
            shouldTransition: () =>findStick.isFinished() && !have_stick(bot) && bot.agentState == 'schedule' && JobCheck(findStick.isFinished()) == true,
            onTransition: () => {
              bot.chat("I didn't found stick in chest");
              bot.prev_jobs.push("find stick for crafting torch uncompleted")
              bot.miss_items.push("stick")
            }
        }),
  
        new StateTransition({
            parent: findStick,
            child: socket_chat_stick,
            shouldTransition: () =>findStick.isFinished() && !have_stick(bot) && bot.agentState == 'chat' && JobCheck(findStick.isFinished()) == true,
            onTransition: () => {
              bot.chat("I didn't found stick in chest");
            }
        }),
        new StateTransition({
            parent: socket_schedule_coal,
            child: exit,
            shouldTransition: () => socket_schedule_coal.isFinished(),
            onTransition: () => {
              bot.prev_jobs.push("find coal for crafting torch uncompleted")
              bot.miss_items.push("coal")
            }
        }),
        new StateTransition({
          parent: socket_chat_coal,
          child: exit,
          shouldTransition: () => socket_chat_coal.isFinished(),
        }),
        new StateTransition({
            parent: socket_schedule_stick,
            child: exit,
            shouldTransition: () => socket_schedule_stick.isFinished(),
        }),
        new StateTransition({
          parent: socket_chat_stick,
          child: exit,
          shouldTransition: () => socket_chat_stick.isFinished(),
        }),
    ];
  
    return new NestedStateMachine(transitions, enter, exit);
  }
  
  exports.createCraftTorchState = createCraftTorchState;
  
  
  
  