/**
 * This behavior will attempt to place the target item against the block at the target
 * position and given target block face. If the block could not be placed for any
 * reason, this behavior fails silently.
 *
 * Even if the block could not be placed, the target item is still equipped if possible.
 */

const BaseBehavior = require("./base_behavior");
const { Movements, goals: { GoalNear ,GoalLookAtBlock}} = require('mineflayer-pathfinder');
class craftBread extends BaseBehavior {

    constructor(bot, targets) {
        super(bot, 'craftBread', targets);
        this.working = true
    }
    async onStateEntered() {

        var name = 'bread'
        var amount = 1
        const defaultMove = new Movements(this.bot)
        const item = this.bot.registry.itemsByName[name]
        const craftingTableID = this.bot.registry.blocksByName.crafting_table.id

        const craftingTable = this.bot.findBlock({
          matching: craftingTableID
        })
        await this.sleepwait(3000)
        // await this.bot.pathfinder.goto(new GoalLookAtBlock(craftingTable.position, this.bot.world));
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

        
        var bread_position = this.bot.S_bread_position

        //await this.bot.pathfinder.setMovements(defaultMove)
        //await this.bot.pathfinder.setGoal(new GoalNear(bread_position.x, bread_position.y, bread_position.z, 1))
    
        // // console.log(this.bot.blockAt(bread_position))
        // // console.log(bread_position)
        await this.sleepwait(2000)
        var chest_window = await this.bot.openChest(this.bot.blockAt(bread_position));
        
        await this.sleepwait(2000)
        await this.depositItem(chest_window,'bread',1)
        await this.bot.closeWindow(chest_window)


        this.working = false
    }
    async withdrawItem (chest,name, amount) {
        const item = this.itemByName(chest.containerItems(), name)
        console.log(chest)
        if (item) {
          try {
            await this.sleepwait(1000)
            
            await chest.withdraw(item.type, null, amount)
            await this.sleepwait(2000)
           
            this.bot.chat(`withdrew ${amount} ${item.name}`)
          } catch (err) {
            this.bot.chat(`unable to withdraw ${amount} ${item.name}`)
          }
        } else {
          this.bot.chat(`unknown item ${name}`)
        }
    }
    async depositItem (chest,name, amount) {
        const item = this.itemByName(chest.items(), name)
        if (item) {
          try {
            await chest.deposit(item.type, null, amount)
            this.bot.chat(`deposited ${amount} ${item.name}`)
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
    async sleepwait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    isFinished() {
        if(his.bot.inventory.items().length == 0)return true
        return false
    }
    
    // canStart() {
    //     const position = this.bot.spawnPoint;
    //     if (!position) {
    //       if(this.shouldComplain())
    //         this.bot.chat("I have nothing !");
    //     }
    //     return position != null;
    // }

    isFinished() {
        if(this.working){
          return false
        }else{
          return true
        }
      }
}
exports.craftBread = craftBread;