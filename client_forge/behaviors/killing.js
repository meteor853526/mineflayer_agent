const {
    StateTransition,
    NestedStateMachine,
    BehaviorIdle,
    BehaviorGetClosestEntity,
    BehaviorMoveTo
} = require("mineflayer-statemachine");
const BaseBehavior = require("./base_behavior");


class BehaviorKilling extends BaseBehavior {
    constructor(bot, targets, enemy_list = []) {
        super(bot, 'killing', targets);
        this.interval = null;
        this.enemy_list = enemy_list;
    }
    onStateEntered() {
        this.interval = setInterval(() => {
            var target = this.targets.entity;
            if (target) {
                target = this.bot.nearestEntity((entity => entity.id == target.id));
                if (!target) {
                    delete this.targets.entity;
                    return;
                }
                target = this.bot.nearestEntity((entity) => this.enemy_list.includes(entity.kind));
                if (!target) {
                    delete this.targets.entity;
                    return;
                }
                var p = target.position;
                var distance = this.bot.entity.position.distanceTo(p);
                if (distance < 3)
                    this.bot.attack(target);
                else
                    delete this.targets.entity;
            }
        }, 500);
    }
    onStateExited() {
        clearInterval(this.interval);
    }
    canStart() {
        if(this.enemy_list.length == 0)
            if(this.shouldComplain())
                this.bot.chat("I don't have enemy list!");
        var target = this.bot.inventory.items().filter(item => item.name.includes("sword") || item.name.includes("axe"))[0]
        if (target == null) {
            if(this.shouldComplain())
                this.bot.chat("I don't have weapon!");
        } else
            this.bot.equip(target, "hand");
        return target != null;
    }
}

function createKillingState(bot, targets, enemy_list) {
    const enter = new BehaviorIdle();
    const exit = new BehaviorIdle();
    targets.unReachCache = [];
    // find entity
    const getClosestPlayer = new BehaviorGetClosestEntity(bot, targets, function(entity) {
        if(targets.unReachCache.includes(entity.id))
            return false;
        return enemy_list.includes(entity.kind);
    });
    // move to entity
    const movetToPlayer = new BehaviorMoveTo(bot, targets);
    movetToPlayer.movements.canDig = false;
    movetToPlayer.distance = 3;
    // attack entity    
    const killing = new BehaviorKilling(bot, targets, enemy_list);

    const transitions = [
        new StateTransition({
            parent: enter,
            child: getClosestPlayer,
            shouldTransition: () => killing.canStart(),
        }),
        new StateTransition({
            parent: enter,
            child: exit,
            shouldTransition: () => true,
        }),
        new StateTransition({
            parent: getClosestPlayer,
            child: movetToPlayer,
            shouldTransition: () => targets.entity !== undefined,
            onTransition: () => {
                targets.position = targets.entity.position;
            }
        }),

        new StateTransition({
            parent: getClosestPlayer,
            child: exit,
            shouldTransition: () => targets.entity === undefined,
        }),
        new StateTransition({
            parent: movetToPlayer,
            child: killing,
            shouldTransition: () => movetToPlayer.distanceToTarget() < 3,
        }),
        new StateTransition({
            parent: movetToPlayer,
            child: exit,
            shouldTransition: () => movetToPlayer.isFinished(),
            onTransition: () => {
                targets.unReachCache.push(targets.entity.id);
                if (targets.unReachCache.length > 10)
                    targets.unReachCache.shift()
            }
        }),
        new StateTransition({
            parent: killing,
            child: exit,
            shouldTransition: () => targets.entity === undefined,
            onTransition: () => {
                delete targets.entity;
                delete targets.position;
            }
        }),
    ];

    return new NestedStateMachine(transitions, enter, exit);
}

exports.createKillingState = createKillingState;
