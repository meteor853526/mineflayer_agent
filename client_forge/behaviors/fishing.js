const {
    StateTransition,
    NestedStateMachine,
    BehaviorIdle,
    BehaviorMoveTo
} = require("mineflayer-statemachine");
const BaseBehavior = require("./base_behavior");
const minecraft_data = require("minecraft-data");

function hashPosition(position) {
    return position.x + "," + position.y + "," + position.z;
}

class BehaviorFindWaterBlock extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'findWaterBlock', targets);
        this.targets.unReachWaterCache = [];
    }
    onStateEntered() {
        this.targets.entity = this.bot.findBlock({
            matching: (block) => this.matchesBlock(block),
            maxDistance: this.maxDistance,
            useExtraInfo: (block) => {
                if (this.targets.unReachWaterCache.includes(hashPosition(block.position))) {
                    return false;
                }
                return true;
            }
        });
    }
    matchesBlock(block) {
        if (block.name != "water") {
            return false;
        }
        return true;
    }
}

class BehaviorFishing extends BaseBehavior {
    constructor(bot, targets) {
        super(bot, 'fishing', targets);
        this.working = false;
        var _this = this;
        bot.on('hardcodedSoundEffectHeard', (soundId, soundCategory, position, volume, pitch) => {
            if (soundId == 272) {
                if (_this.working) {
                    this.bot.activateItem();
                    _this.working = false;
                }
            }
        });
    }

    onStateEntered() {
        this.working = true;
        this.startJob();
        this.bot.activateItem();
    }

    isFinished() {
        if(this.isTimeout() && this.working) {
            this.bot.activateItem();
            this.working = false;
        }
        return !this.working;
    }

    canStart() {
        var target = this.bot.inventory.items().filter(item => item.name == "fishing_rod")[0];
        if (target == null) {
            if(this.shouldComplain())
                this.bot.chat("I don't have fishing rod");
        } else
            this.bot.equip(target, "hand");
        return target != null;
    }
}

function createFishingState(bot, targets) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();    
    // find water
    const getWaterBlock = new BehaviorFindWaterBlock(bot, targets);
    // move to entity
    const movetToPlayer = new BehaviorMoveTo(bot, targets);
    movetToPlayer.movements.canDig = false;
    movetToPlayer.distance = 3;
    // attack entity    
    const fishing = new BehaviorFishing(bot, targets);

    const transitions = [
        new StateTransition({
            parent: enter,
            child: getWaterBlock,
            shouldTransition: () => fishing.canStart(),
        }),
        new StateTransition({
            parent: enter,
            child: exit,
            shouldTransition: () => true,
        }),
        new StateTransition({
            parent: getWaterBlock,
            child: movetToPlayer,
            shouldTransition: () => targets.entity,
            onTransition: () => {
                targets.position = targets.entity.position;
            }
        }),

        new StateTransition({
            parent: getWaterBlock,
            child: exit,
            shouldTransition: () => !targets.entity,
            onTransition: () => {
                if(getWaterBlock.shouldComplain()){
                    bot.chat("No water block found");
                }
            }
        }),
        new StateTransition({
            parent: movetToPlayer,
            child: fishing,
            shouldTransition: () => movetToPlayer.distanceToTarget() < 3,
            onTransition: () => {
                targets.position = targets.entity.position;
            }
        }),
        new StateTransition({
            parent: movetToPlayer,
            child: exit,
            shouldTransition: () => movetToPlayer.isFinished(),
            onTransition: () => {
                if (targets.entity != null)
                    targets.unReachWaterCache.push(hashPosition(targets.entity.position));
            }
        }),
        new StateTransition({
            parent: fishing,
            child: exit,
            shouldTransition: () => fishing.isFinished(),
            onTransition: () => {
                delete targets.entity;
                delete targets.position;
            }
        }),
    ];

    return new NestedStateMachine(transitions, enter, exit);
}

exports.createFishingState = createFishingState;
