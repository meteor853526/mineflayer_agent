const {
    StateTransition
} = require("mineflayer-statemachine");

// misc

function bot_logging(bot, ...messages) {
    console.log(bot.username, ...messages);
}

function gameTimeToRealTime(time) {
    var converted = new Date(time / 24000 * 86400 * 1000).toISOString().substr(11, 8);
    return converted;
}

// bot state transition
function shouldTransition(mcBot, jobID) {
    // var now = mcBot.bot.time.timeOfDay;
    // for (var index = 0; index < mcBot.JobQueue.length; index++)
    //     if (mcBot.JobQueue[index].jobID == jobID && mcBot.JobQueue[index].start <= now && mcBot.JobQueue[index].end > now) 
    //         return true;
    // return false;
    if (mcBot.JobQueue.length !== 0){
   
        if(mcBot.JobQueue[0] == jobID){
            mcBot.JobQueue.shift();
            mcBot.job = BOT_JOB_NAME[jobID];
            return true;
        }
    }
    return false;

}

class BotStateTransition extends StateTransition {
    constructor({ parent, child, name, jobID }, mcBot) {
        super({
            parent,
            child,
            name,
            shouldTransition: () => shouldTransition(mcBot, jobID),
            onTransition: () => {
                if (mcBot.job != BOT_JOB_NAME[jobID]) {
                    bot_logging(mcBot.bot, "Start job " + BOT_JOB_NAME[jobID]);
                    mcBot.bot.chat("Start job " + BOT_JOB_NAME[jobID]);
                    mcBot.job = BOT_JOB_NAME[jobID];
                }
            }
        });
    }
}

// job schedule 
const BOT_JOB_TYPE = {
    IDLE: 18,
    GOHOME: 1,
    HARVEST: 2,
    PUT_TOOLS_BACK_TO_CHEST:3 ,
    COLLECTING_SEEDS_AND_TOOLS: 4,
    SLEEP: 5,
    EAT: 6,
    FIND_FOOD: 8,
    GOFARM: 9,
    GOGUILD: 10,
    CRAFT_BREAD: 12,
    DROP_ENTITY: 13,
    FISHING: 15,
    MINING: 16,
    FEEDCHICKEN: 17,
    JUSTTALKINGANDIDLE: 18,
    SOW: 19,
    CUTDOWNTREE: 21,
    WAKEUP: 22,
    KILL: 23,
    GOLOGGINGCAMP: 26,
    CRAFT_PICKAXE: 27,
    FEEDPIG: 28,
    CRAFT_HOE: 29,
    PUT_BACK_AXE_AND_WOOD: 30,
    BURN_CHARCOAL: 31,
    CRAFT_TORCH: 32,
    CRAFT_AXE: 33,
    CRAFT_STICK: 34,
    WOODTRANSFORM: 35,
    GOSMELTINGPLANT: 36,
    GOPOULTRYFARM: 37,
    GOPIGEON: 38,
    GOPOND: 39,
    ASKFORHELP: 40,
    FIND_WHEAT_SEEDS: 41,
    FIND_CARROT: 42,
    FIND_CHARCOAL: 43,
    FIND_COAL: 44,
    FIND_COBBLESTONE: 45,
    FIND_FISHING_ROD: 46,
    FIND_LADDER: 47,
    FIND_OAK_SAPLING: 48,
    FIND_OAK_LOG: 49,
    FIND_OAK_PLANKS: 50,
    FIND_STICK: 51,
    FIND_STONE_AXE: 52,
    FIND_STONE_HOE: 53,
    FIND_STONE_PICKAXE: 54,
    FIND_STONE_SWORD: 55,
    FIND_WHEAT: 56,
    FIND_WOODEN_AXE: 57,
    FIND_WOODEN_HOE: 58,
    FIND_WOODEN_PICKAXE: 59,
    PLANT_TREE: 60,
}

const BOT_JOB_NAME = Object.keys(BOT_JOB_TYPE).reduce((acc, key) => {
    acc[BOT_JOB_TYPE[key]] = key;
    return acc;
}
, {});

class BotSchedule {
    constructor(start, end, jobID) {
        this.start = start;
        this.end = end;
        this.jobID = jobID;
        this.jobName = BOT_JOB_NAME[jobID];
    }
}

module.exports = {
    bot_logging,
    gameTimeToRealTime,
    shouldTransition,
    BotStateTransition,
    BOT_JOB_TYPE,
    BotSchedule,
}

