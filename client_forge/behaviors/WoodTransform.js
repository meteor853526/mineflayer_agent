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
  
  
class BehaviorWoodTransform extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'woodTransform', targets);
        this.working = false;
    }
    async onStateEntered() {
        this.working = true
        const mcData = require('minecraft-data')(this.bot.version)
        const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
        var chest_window 
        var chest

        // to crafting oak_planks
        var name = 'oak_planks'
        const item = this.bot.registry.itemsByName[name]
        var oak_log = this.bot.registry.itemsByName['oak_log'].id
        var amount = 0
        if(await this.bot.inventory.findInventoryItem(oak_log)){
           amount = await this.bot.inventory.findInventoryItem(oak_log).count
        }
        console.log("amount")
        console.log(amount)
        const craftingTableID = this.bot.registry.blocksByName.crafting_table.id

        const craftingTable = this.bot.findBlock({
            matching: craftingTableID,
            maxDistance: 32
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
  
class FindlogfromChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'Equiplog', targets);
        this.targets.unReachWaterCache = [];
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
        await this.bot.pathfinder.setMovements(defaultMove)
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
            var target = chest_window.containerItems().filter(item => item.name.includes("oak_log"))[0];
            await sleepwait(2000)
            if(target){
                var log_count  = target.count
                log_count = log_count/2
                await this.withdrawItem(chest_window,'oak_log',parseInt(log_count));
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

class putplankBackToChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'putPlankBackToChest', targets);
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        var plank_chest_position = this.bot.plank_chest_position
        var oak_planks = mcData.itemsByName['oak_planks'].id;
        await sleepwait(2000)
        console.log("?????????????????")
        if(await this.bot.inventory.findInventoryItem(oak_planks)){
          console.log("????")
          var stick_number = await this.bot.inventory.findInventoryItem(oak_planks).count
          await this.bot.pathfinder.goto(new GoalLookAtBlock(plank_chest_position, this.bot.world));
          await sleepwait(2000)
          var chest_window = await this.bot.openChest(this.bot.blockAt(plank_chest_position));
          await sleepwait(2000)
          await this.depositItem(chest_window,'oak_planks',plank_chest_position);
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
  
  
function have_oak_log(bot){
    if(bot.inventory.items().filter(item => item.name.includes("oak_log"))[0])
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
function createWoodTransformState(bot, targets) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();    
    // state
    const transform = new BehaviorWoodTransform(bot, targets);
    const plankBack = new putplankBackToChest(bot, targets);
    const find_log = new FindlogfromChest(bot, targets); 
    const socket_schedule = new Socket_schedule(bot,targets,"oak_planks","I don't have the stick")
    const socket_chat = new Socket_chat(bot,targets,"oak_planks","I don't have the stick,so I cant craft stone_hoe.")

    const transitions = [
        new StateTransition({
            parent: enter,
            child: transform,
            shouldTransition: () => have_oak_log(bot),
        }),
        new StateTransition({
            parent: enter,
            child: find_log,
            shouldTransition: () => !have_oak_log(bot),
            onTransition: () => {
              bot.chat("No oak_log on my body");
          }
        }),
        new StateTransition({
            parent: transform,
            child: plankBack,
            shouldTransition: () => transform.isFinished() && JobCheck(transform.isFinished()) == true,
            onTransition: () => {
              bot.chat("transform over");
              console.log("transform over")
            }
        }),
        new StateTransition({
          parent: plankBack,
          child: exit,
          shouldTransition: () =>plankBack.isFinished() && JobCheck(plankBack.isFinished()) == true,
          onTransition: () => {
            bot.chat("all over");
            console.log("all over")
          }
      }),
  
        new StateTransition({
          parent: find_log,
          child: transform,
          shouldTransition: () => find_log.isFinished() && have_oak_log(bot) && JobCheck(find_log.isFinished()) == true,
          onTransition: () => {
            bot.chat("I found oak_log in chest");
          }
        }),
        new StateTransition({
            parent: find_log,
            child: socket_schedule,
            shouldTransition: () =>find_log.isFinished() && !have_oak_log(bot) && bot.agentState == 'schedule' && JobCheck(find_log.isFinished()) == true,
            onTransition: () => {
              bot.chat("I didn't found oak_log in chest");
            }
        }),
  
        new StateTransition({
            parent: find_log,
            child: socket_chat,
            shouldTransition: () => find_log.isFinished() && !have_oak_log(bot) && bot.agentState == 'chat' && JobCheck(find_log.isFinished()) == true,
            onTransition: () => {
              bot.chat("I didn't found oak_log in chest");
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
  
  exports.createWoodTransformState = createWoodTransformState;
  
  
  
  