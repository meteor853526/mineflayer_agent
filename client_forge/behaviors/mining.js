const {
    StateTransition,
    NestedStateMachine,
    BehaviorIdle,
    BehaviorGetClosestEntity,
    BehaviorMoveTo
} = require("mineflayer-statemachine");
const BaseBehavior = require("./base_behavior");
const Vec3 = require("vec3").Vec3;

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

function createMiningState(bot, targets) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();
    // go to mine area
    const moveToMine = new BehaviorMoveTo(bot, targets);
    moveToMine.movements.canDig = false;
    // dig!
    const digging = new BehaviorMining(bot, targets);
    var retry = 0;

    const transitions = [
        new StateTransition({
            parent: enter,
            child: exit,
            shouldTransition: () => !digging.canStart(),
            onTransition: () => {
                if(digging.shouldComplain()) {
                    bot.chat("I don't have pickaxe!");
                }
            }
        }),
        new StateTransition({
            parent: enter,
            child: moveToMine,
            shouldTransition: () => bot.entity.position != null,
            onTransition: () => {
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
                if(retry++ > 5) {
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
