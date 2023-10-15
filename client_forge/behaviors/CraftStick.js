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
  
  
class BehaviorCraftStick extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'craftStick', targets);
        this.working = false;
    }
    async onStateEntered() {
        this.working = true
        const mcData = require('minecraft-data')(this.bot.version)
        const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
        var chest_window 
        var chest

        // to crafting stick
        var name = 'stick'
        var amount = 1
        const item = this.bot.registry.itemsByName[name]
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
  
class FindplankfromChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'Equipplank', targets);
        this.targets.unReachWaterCache = [];
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
        await this.bot.pathfinder.setMovements(defaultMove)
        await sleepwait(1000)
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
            var target = chest_window.containerItems().filter(item => item.name.includes("oak_planks"))[0];
            await sleepwait(2000)
            if(target){
                await this.withdrawItem(chest_window,'oak_planks',2);
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

class putStickBackToChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'putStickBackToChest', targets);
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        var stick_chest_position = this.bot.stick_chest_position
        var stick = mcData.itemsByName['stick'].id;
        await sleepwait(2000)
        console.log("?????????????????")
        if(await this.bot.inventory.findInventoryItem(stick)){
          console.log("????")
          var stick_number = await this.bot.inventory.findInventoryItem(stick).count
          await this.bot.pathfinder.goto(new GoalLookAtBlock(stick_chest_position, this.bot.world));
          await sleepwait(2000)
          var chest_window = await this.bot.openChest(this.bot.blockAt(stick_chest_position));
          await sleepwait(2000)
          await this.depositItem(chest_window,'stick',stick_number);
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
  
  
function have_oak_planks(bot){
    if(bot.inventory.items().filter(item => item.name.includes("oak_planks"))[0]){
        if(bot.inventory.items().filter(item => item.name.includes("oak_planks"))[0].count>=2){
            return true
        }
        return false
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
function createCraftStickState(bot, targets) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();    
    // state
    const craftStick = new BehaviorCraftStick(bot, targets);
    const stickBack = new putStickBackToChest(bot, targets);
    const find_plank = new FindplankfromChest(bot, targets); 
    const socket_schedule = new Socket_schedule(bot,targets,"find oak_planks","oak_planks","5. go to loggingCamp and find 'oak_planks'")
    const socket_chat = new Socket_chat(bot,targets,"oak_planks","I don't have the stick,so I cant craft stone_hoe.")

    const transitions = [
        new StateTransition({
            parent: enter,
            child: craftStick,
            shouldTransition: () => have_oak_planks(bot),
        }),
        new StateTransition({
            parent: enter,
            child: find_plank,
            shouldTransition: () => !have_oak_planks(bot),
            onTransition: () => {
              bot.chat("No oak_planks on my body");
          }
        }),
        new StateTransition({
            parent: craftStick,
            child: stickBack,
            shouldTransition: () => craftStick.isFinished() && JobCheck(craftStick.isFinished()) == true,
            onTransition: () => {
              bot.chat("craftStick over");
              console.log("craftStick over")
            }
        }),
        new StateTransition({
          parent: stickBack,
          child: exit,
          shouldTransition: () =>stickBack.isFinished() && JobCheck(stickBack.isFinished()) == true,
          onTransition: () => {
            bot.chat("all over");
            console.log("all over")
          }
      }),
  
        new StateTransition({
          parent: find_plank,
          child: craftStick,
          shouldTransition: () => find_plank.isFinished() && have_oak_planks(bot) && JobCheck(find_plank.isFinished()) == true,
          onTransition: () => {
            bot.chat("I found oak_planks in chest");
          }
        }),
        new StateTransition({
            parent: find_plank,
            child: socket_schedule,
            shouldTransition: () =>find_plank.isFinished() && !have_oak_planks(bot) && bot.agentState == 'schedule' && JobCheck(find_plank.isFinished()) == true,
            onTransition: () => {
              bot.prev_jobs.push("find oak_planks for crafting stick uncompleted")
              bot.miss_items.push("oak_planks")
              bot.chat("I didn't found oak_planks in chest");
            }
        }),
  
        new StateTransition({
            parent: find_plank,
            child: socket_chat,
            shouldTransition: () => find_plank.isFinished() && !have_oak_planks(bot) && bot.agentState == 'chat' && JobCheck(find_plank.isFinished()) == true,
            onTransition: () => {
              bot.chat("I didn't found oak_planks in chest");
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
  
  exports.createCraftStickState = createCraftStickState;
  
  
  
  