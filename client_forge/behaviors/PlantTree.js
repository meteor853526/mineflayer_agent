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
  
  
  
  class BehaviorPlantTree extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'PlantTree', targets);
        this.working = true;
    }
  
    async onStateEntered() {
      this.working = true;
  
      const target = this.bot.inventory.items().filter(item => item.name.includes("oak_sapling"))[0]
      this.bot.equip(target, "hand");
      while (1) {
        const toPlant = await this.blockToPlant(this.bot)
        console.log(toPlant)
        if (toPlant) {
          await this.move(toPlant)
          await this.sleep(2500);
          await this.bot.placeBlock(toPlant, new Vec3(0, 1, 0))
          await this.sleep(1500);
        } else {
          break
        }
      }
      await this.sleep(1500);
      this.working = false;
    }
  
    async blockToPlant(bot){
      return await bot.findBlock({
        point: this.bot.entity.position,
        matching: mcData.blocksByName['dirt'].id,
        maxDistance: 10,
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
  
  class FindSaplingfromChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'EquipOak_sapling', targets);
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
          var target = chest_window.containerItems().filter(item => item.name.includes("oak_sapling"))[0];
          await sleepwait(2000)
          if(target){
            if(this.bot.inventory.items().filter(item => item.name.includes("oak_sapling"))[0]){
              var sapling_count  = this.bot.inventory.findInventoryItem(oak_sapling).count
              if(sapling_count > 4) break
            }
            var chest_sapling = target.count
            await this.withdrawItem(chest_window,'oak_sapling',chest_sapling);
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
  
  class putSaplingBackToChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'putSaplingBackToChest', targets);
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        var oak_sapling_chest_position = this.bot.oak_sapling_chest_position
        var oak_sapling = mcData.itemsByName['oak_sapling'].id;
        await sleepwait(2000)
     
        if(await this.bot.inventory.findInventoryItem(oak_sapling)){
      
          var oak_sapling_number = await this.bot.inventory.findInventoryItem(oak_sapling).count
          await this.bot.pathfinder.goto(new GoalLookAtBlock(oak_sapling_chest_position, this.bot.world));
          await sleepwait(2000)
          var chest_window = await this.bot.openChest(this.bot.blockAt(oak_sapling_chest_position));
          await sleepwait(2000)
          await this.depositItem(chest_window,'oak_sapling',oak_sapling_number);
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
  
    class FindForest extends BaseBehavior{
        constructor(bot, targets) {
        super(bot, 'findForest', targets);
        this.targets.unReachWaterCache = [];
        this.working = true
        }
        async onStateEntered() {
            this.working = true
            const mcData = require('minecraft-data')(this.bot.version)
            const defaultMove = new Movements(this.bot)
            defaultMove.canDig = false

            await this.bot.pathfinder.setMovements(defaultMove)
            await this.bot.pathfinder.goto(new GoalNear(this.bot.forest.x, this.bot.forest.y, this.bot.forest.z, 0))

            this.working = false
            async function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
        }
        isFinished() {
            if(this.working){
                return false
            }else{
                return true
            }
        }
    }

  var oak_sapling = mcData.itemsByName['oak_sapling'].id;
  function have_oak_sapling(bot){
    if(bot.inventory.items().filter(item => item.name.includes("oak_sapling"))[0]){
      var sapling_count  = bot.inventory.findInventoryItem(oak_sapling).count
      if(sapling_count > 4)return true
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
  function createPlantTreeState(bot, targets) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();    
    // state
    const goForest = new FindForest(bot, targets);
    const plant = new BehaviorPlantTree(bot, targets);
    const oakSaplingBack = new putSaplingBackToChest(bot, targets);
    const find_OakSapling = new FindSaplingfromChest(bot, targets);  // item , observe' give you the wheat to make some bread'
    const socket_schedule = new Socket_schedule(bot,targets,"oak_sapling","I don't have oak_sapling")
    const socket_chat = new Socket_chat(bot,targets,"oak_sapling","I don't have  oak_sapling,so I can't plant the tree")
    const transitions = [
        new StateTransition({
            parent: enter,
            child: goForest,
            shouldTransition: () => true,
        }),
        new StateTransition({
            parent: goForest,
            child: plant,
            shouldTransition: () => goForest.isFinished() && have_oak_sapling(bot) && JobCheck(goForest.isFinished()) == true,
        }),
        new StateTransition({
            parent: goForest,
            child: find_OakSapling,
            shouldTransition: () => goForest.isFinished() && !have_oak_sapling(bot) && JobCheck(goForest.isFinished()) == true,
            onTransition: () => {
              bot.chat("No oak_sapling on my body");
          }
        }),
        new StateTransition({
            parent: plant,
            child: oakSaplingBack,
            shouldTransition: () => plant.isFinished() && JobCheck(plant.isFinished()) == true,
            onTransition: () => {
            //   bot.chat("Plant over");
              bot.prev_jobs.push("Plant over")
              console.log("Plant over")
            }
        }),
        new StateTransition({
          parent: oakSaplingBack,
          child: exit,
          shouldTransition: () =>oakSaplingBack.isFinished() && JobCheck(oakSaplingBack.isFinished()) == true,
          onTransition: () => {
            bot.chat("all over");
            console.log("all over")
          }
      }),
  
        new StateTransition({
          parent: find_OakSapling,
          child: goForest,
          shouldTransition: () => find_OakSapling.isFinished() && have_oak_sapling(bot) && JobCheck(find_OakSapling.isFinished()) == true,
          onTransition: () => {
            // bot.chat("I found wheat_seeds in chest");
          }
        }),
        new StateTransition({
            parent: find_OakSapling,
            child: socket_schedule,
            shouldTransition: () =>find_OakSapling.isFinished() && !have_oak_sapling(bot) && bot.agentState == 'schedule' && JobCheck(find_OakSapling.isFinished()) == true,
            onTransition: () => {
            //   bot.chat("I didn't found oak_sapling in chest");
              bot.prev_jobs.push("find oak_sapling for planting uncomplete")
              console.log("uncomplete planting tree find oak_sapling")
            }
        }),
  
        new StateTransition({
            parent: find_OakSapling,
            child: socket_chat,
            shouldTransition: () => find_OakSapling.isFinished() && !have_oak_sapling(bot) && bot.agentState == 'chat' && JobCheck(find_OakSapling.isFinished()) == true,
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
  
  exports.createPlantTreeState = createPlantTreeState;
  
  
  
  