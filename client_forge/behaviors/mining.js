const {
    StateTransition,
    NestedStateMachine,
    BehaviorIdle,
    BehaviorGetClosestEntity,
    BehaviorMoveTo,
    sleep
} = require("mineflayer-statemachine");
const BaseBehavior = require("./base_behavior");
const {Movements, goals: { GoalNear ,GoalLookAtBlock}} = require('mineflayer-pathfinder')
const { BehaviorGoSmeltingPlant } = require("./go_smeltingPlant")
const { BehaviorGotoGuild } = require("./go_guild")
const Vec3 = require("vec3").Vec3;
const mineflayer_pathfinder = require("mineflayer-pathfinder");
const mcData = require('minecraft-data')('1.16.5')

class BehaviorMining extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'mining', targets);
        this.interval = null;
        this.working = false;
    }
    async onStateEntered() {
        this.working = true;
        // dig 3 * 3 area centered at center
        for(var y = 1; y >= -1; y--) {
            for(var x = -1; x <= 1; x++)
                for(var z = -1; z <= 1; z++) {
                    var block = this.bot.blockAt(this.targets.mine_center.offset(x, y, z));
                    if(block != null && block.name != "ladder" && this.bot.canDigBlock(block) && this.canStart()) {
                        try {
                            await this.bot.dig(block, true);
                        } catch (err) {
                        }
                    }
                }
            var refenceBlock = this.bot.blockAt(this.targets.mine_center.offset(-2, y, 0));
            if(refenceBlock != null && refenceBlock.name != "air") {
                if(await this.findLadder()) {
                    try {
                        if(this.bot.blockAt(refenceBlock.position.offset(1, y, 0)).name != "ladder")
                            await this.bot.placeBlock(refenceBlock, new Vec3(1, 0, 0));
                    } catch (err) {
                        this.bot.chat("I can't place ladder!");
                    }
                } else 
                    break;
            }
        }
        this.working = false;
    }
    
    isFinished() {
        return !this.working;
    }

    canStart() {
        var target = this.bot.inventory.items().filter(item => item.name.includes("pickaxe"))[0]
        if (target == null) {
            if(this.shouldComplain())
                this.bot.chat("I don't have pickaxe!");
        } else
            this.bot.equip(target, "hand");
        return target != null;
    }

    async findLadder() {
        var ladder = this.bot.inventory.items().filter(item => item.name.includes("ladder"))[0]
        if (ladder == null) {
            if(this.shouldComplain())
                this.bot.chat("I don't have ladder!");
            return false;
        }
        await this.bot.equip(ladder, "hand");
        return true;
    }
}

class FindPickaxefromChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'EquipPickaxe', targets);
        this.targets.unReachWaterCache = [];
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
        await this.bot.pathfinder.setMovements(defaultMove)
        await this.bot.pathfinder.setGoal(new GoalNear(this.bot.furnace_position.x, this.bot.furnace_position.y, this.bot.furnace_position.z, 1))
        await sleepwait(2000)
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
    //   console.log(chest)
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

  class FindLadderfromChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'EquipLadder', targets);
        this.targets.unReachWaterCache = [];
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
        await this.bot.pathfinder.setMovements(defaultMove)
        await this.bot.pathfinder.setGoal(new GoalNear(this.bot.furnace_position.x, this.bot.furnace_position.y, this.bot.furnace_position.z, 1))
        await sleepwait(2000)
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
          var target = chest_window.containerItems().filter(item => item.name.includes("ladder"))[0];
          await sleepwait(2000)
          if(target){
            const ladder_count = target.count;
            await this.withdrawItem(chest_window,'ladder',ladder_count);
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
    //   console.log(chest)
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

  class GotoMine extends BaseBehavior {
    constructor(bot, targets) {
      super(bot, 'goToMine', targets);
      const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
        this.working = true
    }
    async onStateEntered() {
        this.working = true
      if(!this.canStart())
        return;
      const pathfinder = this.bot.pathfinder;
      if(this.bot.username == "diedie"){
        var position = this.bot.furnace_position;
      }else{
        var position = this.bot.spawnPoint;
      }
      const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
        await this.bot.pathfinder.setMovements(defaultMove)
        await this.bot.pathfinder.setGoal(new GoalNear(this.bot.mining_position.x, this.bot.mining_position.y, this.bot.mining_position.z, 1))
        await this.sleep(30000)
        this.working = false
    }
  
    isFinished() {
        if(this.working){
          return false
        }else{
          return true
        }
    }
  
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

    canStart() {
      const position = this.bot.spawnPoint;
      if (!position) {
        if(this.shouldComplain())
          this.bot.chat("I don't have Smelting Plant!");
      }
      return position != null;
    }
  }

function have_ladder (bot) {
    if(bot.inventory.items().filter(item => item.name.includes("ladder"))[0]){
        return true
    }
    return false
}

function have_pickaxe (bot) {
    if(bot.inventory.items().filter(item => item.name.includes("stone_pickaxe"))[0]) return true
    return false
}

function createMiningState(bot, targets) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();
    
    const gotoSmelter = new BehaviorGoSmeltingPlant(bot, targets);
    const go_guild = new BehaviorGotoGuild(bot, targets);
    const goToMine = new GotoMine(bot, targets);
    // go to mine area
    const moveToMine = new BehaviorMoveTo(bot, targets);
    moveToMine.movements.canDig = false;
    // dig!
    const digging = new BehaviorMining(bot, targets);

    const find_pickaxe = new FindPickaxefromChest(bot, targets);
    const find_ladder = new FindLadderfromChest(bot, targets);

    // const transitions = [
    //     new StateTransition({
    //         parent: enter,
    //         child: exit,
    //         shouldTransition: () => !digging.canStart(),
    //         onTransition: () => {
    //             if(digging.shouldComplain()) {
    //                 bot.chat("I don't have pickaxe!");
    //             }
    //         }
    //     }),
    //     new StateTransition({
    //         parent: enter,
    //         child: moveToMine,
    //         shouldTransition: () => bot.entity.position != null,
    //         onTransition: () => {
    //             // console.log("wait")
    //             if(targets.mine_center == null) {
    //                 targets.mine_center = bot.entity.position.clone();
    //                 targets.mine_center.x = Math.floor(targets.mine_center.x) + 0.5;
    //                 targets.mine_center.y = Math.floor(targets.mine_center.y);
    //                 targets.mine_center.z = Math.floor(targets.mine_center.z) + 0.5;
    //             }
    //             while(bot.blockAt(targets.mine_center.offset(0, -1, 0)).name == "air")
    //             targets.mine_center.y--;
    //             targets.position = targets.mine_center;
    //         }
    //     }),
    //     new StateTransition({
    //         parent: moveToMine,
    //         child: digging,
    //         shouldTransition: () => moveToMine.distanceToTarget() < 2,
    //     }),
    //     new StateTransition({
    //         parent: moveToMine,
    //         child: exit,
    //         shouldTransition: () => moveToMine.isFinished(),
    //         onTransition: () => {
    //             if(retry++ > 5) { // 5 -> 10
    //                 if(digging.shouldComplain()) {
    //                     bot.chat("I can't move to mine! Start a new mine!");
    //                     targets.mine_center = null;
    //                 }
    //                 retry = 0;
    //             }
    //         }
    //     }),
    //     new StateTransition({
    //         parent: digging,
    //         child: exit,
    //         shouldTransition: () => digging.isFinished()
    //     }),
    // ];

    // v1
    // const transitions = [
    //     new StateTransition({
    //         parent: enter,
    //         child: gotoSmelter,
    //         shouldTransition: () => !have_ladder(bot) || !have_pickaxe(bot) == true,
    //     }),
    //     new StateTransition({
    //         parent: enter,
    //         child: goToMine,
    //         shouldTransition: () => have_ladder(bot) && have_pickaxe(bot) == true,
    //     }),
    //     new StateTransition({
    //         parent: gotoSmelter,
    //         child: find_pickaxe,
    //         shouldTransition: () => !have_pickaxe(bot) && gotoSmelter.isFinished() == true,
    //         onTransition: () => {
    //             console.log("i dont have pickaxe!")
    //         }
    //     }),
    //     new StateTransition({
    //         parent: find_pickaxe,
    //         child: find_ladder,
    //         shouldTransition: () => !have_ladder(bot) && have_pickaxe(bot) && find_pickaxe.isFinished() == true,
    //         onTransition: () => {
    //             console.log("i have pickaxe!")
    //             console.log("i dont have ladder!")
    //         }
    //     }),
    //     new StateTransition({
    //         parent: gotoSmelter,
    //         child: find_ladder,
    //         shouldTransition: () => gotoSmelter.isFinished() && have_pickaxe(bot) && !have_ladder(bot) == true,
    //         onTransition: () => {
    //             console.log("i dont have ladder!")
    //             console.log("i have pickaxe!")
    //             console.log("i dont have ladder!")
    //         }
    //     }),
    //     new StateTransition({
    //         parent: find_ladder,
    //         child: goToMine,
    //         shouldTransition: () => find_ladder.isFinished() && have_ladder(bot) && have_pickaxe(bot) == true &&  bot.entity.position != null,
    //         onTransition: () => {
    //         }
    //     }),
    //     new StateTransition({
    //         parent: goToMine,
    //         child: moveToMine,
    //         // shouldTransition: () => moveToMine.distanceToTarget() < 2,
    //         shouldTransition: () => goToMine.isFinished() && have_ladder(bot) && have_pickaxe(bot) && digging.canStart() == true,
    //         onTransition: () => {
    //             console.log("gogogo i have both tools")
    //             targets.mine_center = bot.mining_position
    //             targets.mine_center.x = bot.mining_position.x
    //             targets.mine_center.y = bot.mining_position.y
    //             targets.mine_center.z = bot.mining_position.z
    //             while(bot.blockAt(targets.mine_center.offset(0, -1, 0)).name == "air")
    //             targets.mine_center.y--;
    //             targets.position = targets.mine_center;
    //         }
    //     }),
    //     new StateTransition({
    //         parent: moveToMine,
    //         child: digging,
    //         shouldTransition: () => moveToMine.distanceToTarget() < 2,
    //     }),
    //     new StateTransition({
    //         parent: moveToMine,
    //         child: exit,
    //         shouldTransition: () => moveToMine.isFinished(),
    //         onTransition: () => {
    //             if(retry++ > 5) { 
    //                 if(digging.shouldComplain()) {
    //                     bot.chat("I can't move to mine! Start a new mine!");
    //                     targets.mine_center = null;
    //                 }
    //                 retry = 0;
    //             }
    //         }
    //     }),
    //     new StateTransition({
    //         parent: digging,
    //         child: exit,
    //         shouldTransition: () => digging.isFinished()
    //     }),
    // ]
    const transitions = [
        new StateTransition({
            parent: enter,
            child: gotoSmelter,
            shouldTransition: () => !digging.canStart() && (!have_ladder(bot)||!have_pickaxe(bot)) == true,
            onTransition: () => {
                // if(digging.shouldComplain()) {
                //     bot.chat("I don't have pickaxe!");
                // }
            }
        }),
        new StateTransition({
            parent: enter,
            child: go_guild,
            shouldTransition: () => have_ladder(bot) && have_pickaxe(bot) == true,
        }),
        new StateTransition({
            parent: go_guild,
            child: goToMine,
            shouldTransition: () => go_guild.isFinished() == true,
        }),
        new StateTransition({
            parent: gotoSmelter,
            child: find_pickaxe,
            shouldTransition: () => gotoSmelter.isFinished() && !digging.canStart() && !have_pickaxe(bot) == true,
            onTransition: () => {
                console.log("i'm finding pickaxe.")
            }
        }),
        new StateTransition({
            parent: gotoSmelter,
            child: find_ladder,
            shouldTransition: () => gotoSmelter.isFinished() && !digging.canStart() && have_pickaxe(bot) && !have_ladder(bot) == true,
            onTransition: () => {
                console.log("i'm finding ladder.")
            }
        }),
        new StateTransition({
            parent: gotoSmelter,
            child: find_pickaxe,
            shouldTransition: () => gotoSmelter.isFinished() && !digging.canStart() && !have_pickaxe(bot) == true,
            onTransition: () => {
                console.log("i'm finding pickaxe.")
            }
        }),
        new StateTransition({
            parent: find_pickaxe,
            child: find_ladder,
            shouldTransition: () => find_pickaxe.isFinished() && !digging.canStart() && have_pickaxe(bot) && !have_ladder(bot) == true,
            onTransition: () => {
                console.log("i found pickaxe.")
                console.log("i'm finding ladder.")
            }
        }),
        new StateTransition({
            parent: find_ladder,
            child: go_guild,
            shouldTransition: () => find_ladder.isFinished() && have_ladder(bot) && have_pickaxe(bot) == true,
        }),
        new StateTransition({
            parent: find_pickaxe,
            child: go_guild,
            shouldTransition: () => find_pickaxe.isFinished() && have_ladder(bot) && have_pickaxe(bot) == true,
        }),
        new StateTransition({
            parent: goToMine,
            child: moveToMine,
            shouldTransition: () => bot.entity.position != null && digging.canStart() && goToMine.isFinished() && have_ladder(bot) && have_pickaxe(bot) == true,
            onTransition: () => {
                // console.log("wait")
                if(targets.mine_center == null) {
                    targets.mine_center = bot.entity.position.clone();
                    targets.mine_center.x = Math.floor(targets.mine_center.x) + 0.5;
                    targets.mine_center.y = Math.floor(targets.mine_center.y);
                    targets.mine_center.z = Math.floor(targets.mine_center.z) + 0.5;
                }
                while(bot.blockAt(targets.mine_center.offset(0, -1, 0)).name == "air")
                targets.mine_center.y--;
                targets.position = targets.mine_center;
            }
        }),
        new StateTransition({
            parent: moveToMine,
            child: digging,
            shouldTransition: () => moveToMine.distanceToTarget() < 2,
        }),
        new StateTransition({
            parent: moveToMine,
            child: exit,
            shouldTransition: () => moveToMine.isFinished(),
            onTransition: () => {
                if(retry++ > 5) { // 5 -> 10
                    if(digging.shouldComplain()) {
                        bot.chat("I can't move to mine! Start a new mine!");
                        targets.mine_center = null;
                    }
                    retry = 0;
                }
            }
        }),
        new StateTransition({
            parent: digging,
            child: exit,
            shouldTransition: () => digging.isFinished()
        }),
    ];
    return new NestedStateMachine(transitions, enter, exit);
}

exports.createMiningState = createMiningState;
