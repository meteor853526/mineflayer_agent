const {
    StateTransition,
    NestedStateMachine,
    BehaviorIdle,
    BehaviorMoveTo
} = require("mineflayer-statemachine");
const BaseBehavior = require("./base_behavior");
const socketIOClient = require('socket.io-client');
const serverURL = 'http://localhost:3000'; 
const Socket_schedule = require("./socket_schedule")
const Socket_chat = require("./socket_chat")
const {BehaviorGotoGuild} = require("./go_guild")
const {BehaviorGoSmeltingPlant} = require("./go_smeltingPlant")
const {Movements, goals: { GoalNear ,GoalLookAtBlock}} = require('mineflayer-pathfinder')
const getWheather = require('../getRealtime.js').getWheather;
const getDistance = require('../getRealtime.js').getDistance;
const getRealtime = require("../getRealtime.js").getRealtime;
const relocate = require("../getRealtime.js").relocate;
const mcData = require('minecraft-data')('1.16.5')
  
  
class BehaviorCraftPickaxe extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'craftPickaxe', targets);
        this.working = false;
    }
    async onStateEntered() {
        this.working = true
        const mcData = require('minecraft-data')(this.bot.version)
        const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
        var chest_window
        var chest

        // to crafting stone_pickaxe
        var name = 'stone_pickaxe'
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
  
class FindstickfromChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'Equipstick', targets);
        this.targets.unReachWaterCache = [];
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
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
            var target = chest_window.containerItems().filter(item => item.name.includes("stick"))[0];
            await sleepwait(2000)
            if(target){
                await this.withdrawItem(chest_window,'stick',2);
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
  
class FindcobblestonefromChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'Equipcobblestone', targets);
        this.targets.unReachWaterCache = [];
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const chest_id = mcData.blocksByName['chest'].id;
        const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
        await sleepwait(1000)
        await this.bot.pathfinder.setMovements(defaultMove)
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
            var target = chest_window.containerItems().filter(item => item.name.includes("cobblestone"))[0];
            await sleepwait(2000)
            if(target){
                await this.withdrawItem(chest_window,'cobblestone',3);
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

class putPickaxeBackToChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'putPickaxeBackToChest', targets);
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
        var woodAxe_chest_position = this.bot.pickaxe_chest_position
        var stone_pickaxe = mcData.itemsByName['stone_pickaxe'].id;
        await sleepwait(2000)
        console.log("?????????????????")
        if(await this.bot.inventory.findInventoryItem(stone_pickaxe)){
          console.log("????")
          var stone_pickaxe_number = await this.bot.inventory.findInventoryItem(stone_pickaxe).count
          await this.bot.pathfinder.goto(new GoalLookAtBlock(woodAxe_chest_position, this.bot.world));
          await sleepwait(2000)
          var chest_window = await this.bot.openChest(this.bot.blockAt(woodAxe_chest_position));
          await sleepwait(2000)
          await this.depositItem(chest_window,'stone_pickaxe',woodAxe_chest_position);
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

class putStickBackToChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'putStickBackToChest', targets);
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
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
          await this.depositItem(chest_window,'stick',stick_chest_position);
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

class putCobblestoneBackToChest extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'putCobblestoneBackToChest', targets);
        this.working = true
    }
    async onStateEntered() {
        this.working = true
        const defaultMove = new Movements(this.bot)
        defaultMove.canDig = false
        var cobblestone_chest_position = this.bot.cobblestone_chest_position
        var cobblestone = mcData.itemsByName['cobblestone'].id;
        await sleepwait(2000)
        console.log("?????????????????")
        if(await this.bot.inventory.findInventoryItem(cobblestone)){
          console.log("????")
          var cobblestone_number = await this.bot.inventory.findInventoryItem(cobblestone).count
          await this.bot.pathfinder.goto(new GoalLookAtBlock(cobblestone_chest_position, this.bot.world));
          await sleepwait(2000)
          var chest_window = await this.bot.openChest(this.bot.blockAt(cobblestone_chest_position));
          await sleepwait(2000)
          await this.depositItem(chest_window,'cobblestone',cobblestone_chest_position);
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
  
function have_stick(bot){
    if(bot.inventory.items().filter(item => item.name.includes("stick"))[0])
        return true
    return false
}
function have_cobblestone(bot){
    if(bot.inventory.items().filter(item => item.name.includes("cobblestone"))[0])
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
function createCraftPickaxeState(bot, targets) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();    
    // state
    const craftPickaxe = new BehaviorCraftPickaxe(bot, targets);
    const pickaxeBack = new putPickaxeBackToChest(bot, targets);
    const stickBack = new putStickBackToChest(bot, targets);
    const cobblestoneBack = new putCobblestoneBackToChest(bot, targets);
    const find_stick = new FindstickfromChest(bot, targets); 
    const find_cobblestone = new FindcobblestonefromChest(bot, targets);  
    const socket_schedule_stick = new Socket_schedule(bot,targets,"find stick"," stick","5. go refinery and find 'stick'")
    const socket_schedule_cobblestone = new Socket_schedule(bot,targets,"find cobblestone"," cobblestone","5. go to the smelter and find 'cobblestone'")
    const socket_chat_stick = new Socket_chat(bot,targets,"stick","I don't have the stick,so I cant craft stone_hoe.")
    const socket_chat_cobblestone = new Socket_chat(bot,targets,"cobblestone","I don't have the cobblestone,so I cant craft stone_hoe.")
    const transitions = [
        new StateTransition({
            parent: enter,
            child: craftPickaxe,
            shouldTransition: () => have_stick(bot) && have_cobblestone(bot),
        }),
        new StateTransition({
            parent: enter,
            child: find_stick,
            shouldTransition: () => !have_stick(bot),
            onTransition: () => {
              bot.chat("No stick on my body");
          }
        }),
        new StateTransition({
            parent: enter,
            child: find_cobblestone,
            shouldTransition: () => !have_cobblestone(bot),
            onTransition: () => {
              bot.chat("No cobblestone on my body");
          }
        }),
        new StateTransition({
            parent: find_stick,
            child: find_cobblestone,
            shouldTransition: () => !have_cobblestone(bot) && have_stick(bot),
            onTransition: () => {
              bot.chat("No cobblestone on my body");
          }
        }),
        new StateTransition({
            parent: find_cobblestone,
            child: find_stick,
            shouldTransition: () => !have_stick(bot) && have_cobblestone(bot),
            onTransition: () => {
              bot.chat("No stick on my body");
          }
        }),
        new StateTransition({
            parent: find_stick,
            child: craftPickaxe,
            shouldTransition: () => have_stick(bot) && have_cobblestone(bot),
        }),
        new StateTransition({
            parent: find_cobblestone,
            child: craftPickaxe,
            shouldTransition: () => have_stick(bot) && have_cobblestone(bot),
        }),
        new StateTransition({
            parent: craftPickaxe,
            child: pickaxeBack,
            shouldTransition: () => craftPickaxe.isFinished() && JobCheck(craftPickaxe.isFinished()) == true,
            onTransition: () => {
              bot.chat("craftPickaxe over");
              console.log("craftPickaxe over")
            }
        }),
        new StateTransition({
          parent: stickBack,
          child: cobblestoneBack,
          shouldTransition: () =>stickBack.isFinished() && JobCheck(stickBack.isFinished()) == true,
          onTransition: () => {
            bot.chat("stickBack over");
            console.log("stickBack over")
          }
        }),
        new StateTransition({
            parent: cobblestoneBack,
            child: pickaxeBack,
            shouldTransition: () =>cobblestoneBack.isFinished() && JobCheck(cobblestoneBack.isFinished()) == true,
            onTransition: () => {
              bot.chat("cobblestoneBack over");
              console.log("cobblestoneBack over")
            }
          }),
          new StateTransition({
            parent: pickaxeBack,
            child: exit,
            shouldTransition: () =>pickaxeBack.isFinished() && JobCheck(pickaxeBack.isFinished()) == true,
            onTransition: () => {
              bot.chat("all over");
              console.log("all over")
            }
          }),
  
        new StateTransition({
          parent: find_stick,
          child: craftPickaxe,
          shouldTransition: () => find_stick.isFinished() && have_stick(bot) && JobCheck(find_stick.isFinished()) == true,
          onTransition: () => {
            bot.chat("I found stick in chest");
          }
        }),
        new StateTransition({
            parent: find_stick,
            child: socket_schedule_stick,
            shouldTransition: () =>find_stick.isFinished() && !have_stick(bot) && bot.agentState == 'schedule' && JobCheck(find_stick.isFinished()) == true,
            onTransition: () => {
                bot.prev_jobs.push("find stick for craft pickaxe uncompleted")
                bot.miss_items.push("stick")  
                bot.chat("I didn't found stick in chest");
            }
        }),
        new StateTransition({
            parent: find_stick,
            child: socket_chat_stick,
            shouldTransition: () => find_stick.isFinished() && !have_stick(bot) && bot.agentState == 'chat' && JobCheck(find_stick.isFinished()) == true,
            onTransition: () => {
              bot.chat("I didn't found stick in chest");
            }
        }),

        new StateTransition({
            parent: find_cobblestone,
            child: craftPickaxe,
            shouldTransition: () => find_cobblestone.isFinished() && have_cobblestone(bot) && JobCheck(find_cobblestone.isFinished()) == true,
            onTransition: () => {
              bot.chat("I found cobblestone in chest");
            }
          }),
          new StateTransition({
              parent: find_cobblestone,
              child: socket_schedule_cobblestone,
              shouldTransition: () =>find_cobblestone.isFinished() && !have_cobblestone(bot) && bot.agentState == 'schedule' && JobCheck(find_cobblestone.isFinished()) == true,
              onTransition: () => {
                bot.prev_jobs.push("find cobblestone for craft pickaxe uncompleted")
                bot.miss_items.push("cobblestone")
                bot.chat("I didn't found cobblestone in chest");
              }
          }),
          new StateTransition({
              parent: find_cobblestone,
              child: socket_chat_cobblestone,
              shouldTransition: () => find_cobblestone.isFinished() && !have_cobblestone(bot) && bot.agentState == 'chat' && JobCheck(find_cobblestone.isFinished()) == true,
              onTransition: () => {
                bot.chat("I didn't found cobblestone in chest");
              }
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
        new StateTransition({
            parent: socket_schedule_cobblestone,
            child: exit,
            shouldTransition: () => socket_schedule_cobblestone.isFinished(),
        }),
        new StateTransition({
          parent: socket_chat_cobblestone,
          child: exit,
          shouldTransition: () => socket_chat_cobblestone.isFinished(),
        }),
    ];
  
    return new NestedStateMachine(transitions, enter, exit);
  }
  
  exports.createCraftPickaxeState = createCraftPickaxeState;
  
  
  
  