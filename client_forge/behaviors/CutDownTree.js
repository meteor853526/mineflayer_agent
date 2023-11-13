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
  
  const mcData = require('minecraft-data')('1.16.5')
  
  
  class BehaviorCutDownTree extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'cutDownTree', targets);
        this.working = false;
    }
    async onStateEntered() {
      this.working = true
      var dropitem = []
      var bot_coordinate = this.bot.entity.position;
      // console.log("XXXXXYYYYZZZZ: "+bot_coordinate)
      this.bot.on('itemDrop', (entity) => {
          console.log(entity);
          let center_A = bot_coordinate.x
          let center_B = bot_coordinate.z
          let A = entity.position.x
          let B = entity.position.z
          let abs_A = Math.abs(A-center_A)
          let abs_B = Math.abs(B-center_B)
          let distance = Math.sqrt(abs_A*abs_A + abs_B*abs_B)
          if(distance < 8 ){
              dropitem.push(entity)
              console.log("item distance:" + distance)
          }
          
      })
      const defaultMove = new Movements(this.bot)
      defaultMove.canDig = false
      var stone_axe = 591
      var oak_log = this.bot.registry.itemsByName.oak_log.id;
      const target = this.bot.inventory.items().filter(item => item.name.includes("stone_axe"))[0]
      this.bot.equip(target, "hand");
      await this.sleep(2000)
      for(var y = 0; y<6; y++){
        for(var x = -3; x <= 3; x++) {
            for(var z = -3; z <= 3; z++) {
                var block = this.bot.blockAt(this.bot.entity.position.offset(x, y, z));
                console.log("????")
                console.log(block.type)
                console.log(block.name)
                if(block.type == 35 || block.type == 60){
                    try {
                        await this.bot.dig(block, true);
                    } catch (err) {
                    }
                }
            }
        }
      }
      // console.log("????")
      // console.log(block.type)
      // console.log(block.name)
      await this.sleep(2000)
      var count1 = 0 // dont delete!!
      while(dropitem.length > 0){
        let item = dropitem.pop()
        console.log(count1+=1)
        console.log(item.position.x)
        await this.bot.pathfinder.setMovements(defaultMove)
    
        await this.bot.pathfinder.setGoal(new GoalNear(parseInt(item.position.x), parseInt(item.position.y), parseInt(item.position.z), 1))
        await this.sleep(2000);
        //await move(this.bot,item.position)
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
  
  class FindAxefromChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'EquipAxe', targets);
        this.targets.unReachWaterCache = [];
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const chest_id = mcData.blocksByName['chest'].id;

        const defaultMove = new Movements(this.bot)
        // await this.bot.pathfinder.setMovements(defaultMove)
        // await this.bot.pathfinder.setGoal(new GoalNear(2263, 63, -2927, 0))
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
          var target = chest_window.containerItems().filter(item => item.name.includes("stone_axe"))[0];
          await sleepwait(2000)
          if(target){
            await this.withdrawItem(chest_window,'stone_axe',1);
            await sleepwait(2000)
            await this.bot.closeWindow(chest_window)
            break;
          }
          await this.bot.closeWindow(chest_window)
          await sleepwait(1000)
          await this.bot.pathfinder.setGoal(new GoalNear(this.bot.forest.x, this.bot.forest.y, this.bot.forest.z, 0));
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
        var tool_chest_position = this.bot.tool_chest_position
        var log_chest_position = this.bot.oak_log_chest_position
        await sleep(2000)
        var allitems = []
        var oak_log = mcData.itemsByName.oak_log.id
        var log_number = await this.bot.inventory.findInventoryItem(oak_log).count
        await this.bot.pathfinder.goto(new GoalLookAtBlock(log_chest_position, this.bot.world));
        await sleep(2000)
        var chest_window = await this.bot.openChest(this.bot.blockAt(log_chest_position));
        await sleep(2000)
        await depositItem("oak_log",log_number,this.bot,chest_window)
        await sleep(2000)
        await this.bot.closeWindow(chest_window)
        await sleep(1000)
        await this.bot.inventory.items().forEach(items =>{
          allitems.push({name:items.name,count:items.count})
        })
        await this.bot.pathfinder.goto(new GoalLookAtBlock(tool_chest_position, this.bot.world));
        await sleep(2000)
        var chest_window = await this.bot.openChest(this.bot.blockAt(tool_chest_position));
        await sleep(2000)
        await Inchest(this.bot,allitems,chest_window)
        await sleep(2000)
        await this.bot.closeWindow(chest_window)

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

    class Find_Tree extends BaseBehavior {
        constructor(bot, targets) {
            super(bot, 'findTree', targets);
            this.targets.unReachWaterCache = [];
            this.working = true
        }
        async onStateEntered() {
          this.working = true
          const mcData = require('minecraft-data')(this.bot.version)
          const defaultMove = new Movements(this.bot)
          defaultMove.canDig = false
          var oak_log_id = mcData.blocksByName['oak_log'].id
          this.bot.pathfinder.setMovements(defaultMove)
          const wood = this.bot.findBlock({
            matching: (block) => {
                return block.type === oak_log_id
            },
            maxDistance: 64
          })
          if(!wood){
              console.log("there's no wood.")
          }
          var wood_position = wood.position
          this.bot.pathfinder.setGoal(new GoalNear(wood_position.x, wood_position.y, wood_position.z, 1))
          sleep(5000)
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
  
  
  function have_stone_axe(bot){
    if(bot.inventory.items().filter(item => item.name.includes("stone_axe"))[0])
      return true
    return false
  }

  function is_Enough(bot){
    if(bot.inventory.items().filter(item => item.name.includes("oak_log"))[0]){
      if(bot.inventory.items().filter(item => item.name.includes("oak_log"))[0].count>12){
        return true
      }
      // console.log("!!!!!!!!!!!!" + bot.inventory.items().filter(item => item.name.includes("spruce_log"))[0].count)
      // return false
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
  function createCutDownTreeState(bot, targets) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();    
    // state
    const findForest = new FindForest(bot, targets);
    const findTree = new Find_Tree(bot, targets);
    const CutDownTree = new BehaviorCutDownTree(bot, targets);
    const allBack = new putAllBackToChest(bot, targets);
    const find_axe = new FindAxefromChest(bot, targets);  // item , observe' give you the wheat to make some bread'
    const socket_schedule = new Socket_schedule(bot,targets,"cut down tree","stone_axe","5. go loggingCamp and search stone_axe from surrounding chest")
    const socket_chat = new Socket_chat(bot,targets,"stone_axe","I don't have the stone_axe,so I can't cut down the tree")
    const transitions = [
      new StateTransition({
        parent: enter,
        child: findForest,
        shouldTransition: () => true,
      }),
      new StateTransition({
        parent: findForest,
        child: find_axe,
        shouldTransition: () => findForest.isFinished() && !have_stone_axe(bot) && JobCheck(findForest.isFinished()) == true,
      }),
      new StateTransition({
        parent: find_axe,
        child: findTree,
        shouldTransition: () => find_axe.isFinished() && have_stone_axe(bot) && JobCheck(find_axe.isFinished()) == true,
      }),
      new StateTransition({
        parent: findForest,
        child: findTree,
        shouldTransition: () => findForest.isFinished() && have_stone_axe(bot) && JobCheck(findForest.isFinished()) == true,
      }),
      new StateTransition({
        parent: find_axe,
        child: socket_schedule,
        shouldTransition: () => find_axe.isFinished() && !have_stone_axe(bot) && JobCheck(find_axe.isFinished()) == true,
        onTransition: () => {
          
          console.log("no axe gogo nothing")
        }
      }),
      new StateTransition({
        parent: findTree,
        child: CutDownTree,
        shouldTransition: () => findTree.isFinished() && JobCheck(findTree.isFinished()) == true,
        onTransition: () => {
          console.log("find Tree!")
        }
      }),
      new StateTransition({
        parent: CutDownTree,
        child: findTree, 
        shouldTransition: () => CutDownTree.isFinished() && JobCheck(CutDownTree.isFinished()) && !is_Enough(bot)== true,
        onTransition: () => {
          console.log("find tree again.")
        }
      }),
      new StateTransition({
        parent: CutDownTree,
        child: allBack,
        shouldTransition: () => CutDownTree.isFinished() && JobCheck(CutDownTree.isFinished()) && is_Enough(bot) == true,
        onTransition: () => {
          console.log("cut down tree over.")
        }
      }),
      new StateTransition({
        parent: allBack,
        child: exit,
        shouldTransition: () => allBack.isFinished() && JobCheck(allBack.isFinished()) == true,
        onTransition: () => {
          console.log("All over.")
        }
      })
    ];
  
    return new NestedStateMachine(transitions, enter, exit);
  }
  
  exports.createCutDownTreeState = createCutDownTreeState;
  
  
  
  