const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals: {GoalFollow}} = require('mineflayer-pathfinder')
var autoVersionForge = require('../src/client/autoVersionForge');

const http = require('http');
const server = http.createServer();
const io = require('socket.io')(server);
const socketIOClient = require('socket.io-client');
const serverURL = 'http://localhost:3000'; 

const { Vec3 } = require('vec3')
const sensor = require('./NewSensor.js').Sensor;

const {
  StateTransition,
  BotStateMachine,
  EntityFilters,
  BehaviorFollowEntity,
  BehaviorLookAtEntity,
  BehaviorGetClosestEntity,
  NestedStateMachine,  
  StateMachineWebserver,
  BehaviorIdle,
  BehaviorMoveTo,
} = require("mineflayer-statemachine");

// custom behavior
const {
  createKillingState,
  createMiningState,
  createFishingState,
  createHarvestState,
  createSowState,
  createCutDownTreeState,
  createCraftTorchState,
  createCraftHoeState,
  createCraftPickaxeState,
  createBurnCharcoalState,
  createCraftStickState,
  createCraftAxeState,
  createFeedChickenState,
  createFeedPigState,
  createWoodTransformState,
  BehaviorGoHome,
  BehaviorGotoGuild,
  dropItem,
  idleforsometime,
  createCraftBreadState,
  BehaviorGoFarmland,
  sleepOnBed,
  wakeUpFromBed,
  BehaviorFollowPlayer,
  eat,
  createFindFood,
  createFindWheat_seeds,
  createFindCarrot,
  createFindCharcoal,
  createFindCoal,
  createFindCobble_stone,
  createFindFishing_rod,
  createFindLadder,
  createFindOak_sapling,
  createFindOak_log,
  createFindOak_planks,
  createFindStick,
  createFindStone_axe,
  createFindStone_hoe,
  createFindStone_pickaxe,
  createFindStone_sword,
  createFindWheat,
  findWooden_axe,
  findWooden_hoe,
  findWooden_pickaxe,
  putToolBackToChest,
  BehaviorAskForHelp,
  BehaviorGoFarm,
  BehaviorGoLoggingCamp,
  BehaviorGoSmeltingPlant,
  BehaviorGoPoultryFarm,
  BehaviorGoPigpen,
  BehaviorGoPond,
  createPlantTreeState,
} = require('./behaviors');
// bot functions
const {
  shouldTransition,
  bot_logging,
  BotStateTransition,
  BOT_JOB_TYPE,
  gameTimeToRealTime,
  BotSchedule
} = require('./ExtendBot');
// const { findCarrot } = require('./behaviors/findCarrot');

const getWheather = require('./getRealtime.js').getWheather;
const getDistance = require('./getRealtime.js').getDistance;
const getRealtime = require("./getRealtime.js").getRealtime;

let botArgs = {
  version: false,
  host: 'localhost',
  port: 3001,
};

const options = {
  forgeMods: undefined,
  channels: undefined,
  registries: undefined,
}

var Agent = ["diedie","Jeff","Guild","worker"]

server.listen(3000, () => {
  console.log('Socket.IO server listening on port 3000.');
});

class MCBot {

  // Constructor
  constructor(username,PortCount) {
      this.username = username;
      this.PortCount = PortCount
      this.host = botArgs["host"];
      this.port = botArgs["port"];
      this.version = botArgs["version"];
      this.JobQueueLock = false
      this.ChatLock = false
      this.countdownInterval; 
      this.countdown = 5000; 
      this.ChatSignal = false
      this.JobQueue = []
      this.initBot();
  }

  // Init bot instance
  initBot() {
      this.bot = mineflayer.createBot({
          "username": this.username,
          "host": this.host,
          "port": this.port,
          "version": this.version,
      });
      
      autoVersionForge(this.bot._client, options);
      this.bot.loadPlugin(pathfinder)
      new sensor(this.bot);
      this.bot.B_bread_position = new Vec3(-10496,71,12753)
      this.bot.S_bread_position = new Vec3(-10496,71,12753)
      this.bot.B_wheat_position = new Vec3(-10496,71,12751)
      this.bot.S_wheat_position = new Vec3(-10496,71,12751)
      this.bot.B_bread_sign_position = new Vec3(-10496,71,12753)
      this.bot.S_bread_sign_position = new Vec3(-10496,71,12753)
      this.bot.B_wheat_sign_position = new Vec3(-10496,71,12751)
      this.bot.S_wheat_sign_position = new Vec3(-10496,71,12751)
      this.bot.home_position = new Vec3(-10506,71,12755);
      this.bot.farm_position = new Vec3(-10564,71,12749);
      this.bot.S_diedie_wheat_chest_position = new Vec3(-10567,71,12744);
      this.bot.S_diedie_wheatSeed_chest_position = new Vec3(-10567,71,12745);
      // this.bot.diedie_home_centerPos = new Vec3(2264,63,-2913);
      this.bot.diedie_home_centerPos = new Vec3(-10499,71,12719);
      this.bot.diedie_home_radius = 5
      this.bot.diedie_farm_centerPos = new Vec3(-10572,71,12749);
      this.bot.diedie_farm_radius = 5.5
      this.bot.PoultryFarm_position = new Vec3(-10543,71,12738);
      this.bot.Pigpen_position = new Vec3(-10541,71,12759);
      this.bot.tool_chest_position = new Vec3(-10550,72,12786);
      this.bot.woodAxe_chest_position = new Vec3(-10559,72,12786);
      this.bot.pickaxe_chest_position = new Vec3(-10509,72,12786);
      this.bot.stick_chest_position = new Vec3(-10502,72,12787);
      this.bot.plank_chest_position = new Vec3(-10548,72,12785);
      this.bot.carrot_chest_position = new Vec3(-10567,71,12743);
      this.bot.cobblestone_chest_position = new Vec3(-10509,72,12790);
      this.bot.forest = new Vec3(-10555, 72, 12787);
      this.bot.furnace_position = new Vec3(-10502, 72, 12782);
      this.bot.craftingTable_position = new Vec3(-10502, 72, 12785);
      this.bot.Hoe_chest_position = new Vec3(-10567,71,12746);
      this.bot.diedie_home_door = new Vec3(-10505,71,12717);
      this.bot.guild_position = new Vec3(-10494, 71, 12750);
      this.bot.Pond_position = new Vec3(-10545,71.5,12678);
      this.bot.coal_chest_position = new Vec3(-10502, 72, 12786);
      this.bot.mining_position = new Vec3(-10573, 72, 12683);
      this.bot.prev_jobs = [];
      this.bot.miss_items = [];
      this.bot.pos = "outdoors";
      this.bot.agentState = "idle"
      this.bot.isRaining = true
      this.socket = socketIOClient(serverURL);
      this.lastPlayer = ''
      this.register()
      this.initEvents()
  }


  JobCheck(check){
  
    if (check === true){
        this.JobQueueLock = false
        this.socket.emit('message', {
          targetSocketId: 'TARGET_SOCKET_ID',
          message:"system:JobFinish",
          sender:"system",
          receiverName: this.bot.username,
          type:"system"
        });
        console.log("--------")
        return true
    }else{
        return false
    }
  }

  register() {
    this.bot.once("login", async () => {
      bot_logging(this.bot, "Logged in");
    });

    this.bot.once("spawn", async () => {
      bot_logging(this.bot, 'Spawned in');
      // mineflayerViewer(this.bot, { port: 3002, prefix: "/bot" })
      this.bot.chat("Hello!");
      const idleState = new BehaviorIdle();
      var transitions = this.createStateTransition(idleState);
      const rootLayer = new NestedStateMachine(transitions, idleState)
      const stateMachine = new BotStateMachine(this.bot, rootLayer)
      var port = 8935 + this.PortCount;
      const webserver = new StateMachineWebserver(this.bot, stateMachine, port);
      webserver.startServer();
      bot_logging(this.bot, `Started a state machine with ${stateMachine.transitions.length} transitions and ${stateMachine.states.length} states`)
    });
  }

  createStateTransition(idleState) {
    var target = {};
    // const goHome = new BehaviorGoHome(this.bot, target);
    const goHome = new BehaviorGoHome(this.bot, target);
    const goFarm = new BehaviorGoFarm(this.bot, target);
    const goSmeltingPlant = new BehaviorGoSmeltingPlant(this.bot, target);
    const goLoggingCamp = new BehaviorGoLoggingCamp(this.bot, target);
    const goPoultryFarm = new BehaviorGoPoultryFarm(this.bot, target);
    const goPigpen = new BehaviorGoPigpen(this.bot, target);
    const goPond = new BehaviorGoPond(this.bot, target);
    const DropItem = new dropItem(this.bot, target)
    const enemy_list = ["Hostile mobs"];
    const getPlayer = new BehaviorGetClosestEntity(this.bot, target, function(entity) {
      return this.bot.players[this.bot.current_talker] ? this.bot.players[this.bot.current_talker].entity : null;
  });
    const kill = createKillingState(this.bot, target, enemy_list);
    const mining = createMiningState(this.bot, target);
    const moveOutMine = new BehaviorMoveTo(this.bot, target);
    const idlefortimes = new idleforsometime(this.bot,target);
    moveOutMine.movements.canDig = false;
    const fishing = createFishingState(this.bot, target);
    const harvest = createHarvestState(this.bot, target);
    const sow = createSowState(this.bot,target);
    const craftbread = new createCraftBreadState(this.bot,target);
    const sleep = new sleepOnBed(this.bot,target);
    const wakeup = new wakeUpFromBed(this.bot,target)
    const go_guild = new BehaviorGotoGuild(this.bot,target);
    const go_farmland = new BehaviorGoFarmland(this.bot,target);
    const followPlayer = new BehaviorFollowPlayer(this.bot,target);//'Dingo_Kez'
    const eat_bread = new eat(this.bot,target);
    const findfoodfromchest = new createFindFood(this.bot,target);
    const findseedfromchest = new createFindWheat_seeds(this.bot,target);
    const findcarrotfromchest = new createFindCarrot(this.bot, target);
    const findcharcoalfromchest = new createFindCharcoal(this.bot, target);
    const findcoalfromchest = new createFindCoal(this.bot, target);
    const findcobblestonefromchest = new createFindCobble_stone(this.bot, target);
    const findfishing_rodfromchest = new createFindFishing_rod(this.bot, target);
    const findladderfromchest = new createFindLadder(this.bot, target);
    const findoak_logfromchest = new createFindOak_log(this.bot, target);
    const findoak_planksfromchest = new createFindOak_planks(this.bot, target);
    const findoak_saplingfromchest = new createFindOak_sapling(this.bot, target);
    const findstickfromchest = new createFindStick(this.bot, target);
    const findstone_axefromchest = new createFindStone_axe(this.bot, target);
    const findstone_hoefromchest = new createFindStone_hoe(this.bot, target);
    const findstone_pickaxefromchest = new createFindStone_pickaxe(this.bot, target);
    const findstone_swordfromchest = new createFindStone_sword(this.bot, target);
    const findwheatfromchest = new createFindWheat(this.bot, target);
    const findwooden_axefromchest = new findWooden_axe(this.bot, target);
    const findwooden_hoefromchest = new findWooden_hoe(this.bot, target);
    const findwoodden_pickaxefromchest = new findWooden_pickaxe(this.bot, target);
    const putTool = new putToolBackToChest(this.bot,target);
    const lookAtPlayer = new BehaviorLookAtEntity(this.bot, this.bot.players['Dingo_Kez'] ? this.bot.players['Dingo_Kez'].entity : null);
    const cutDownTree = createCutDownTreeState(this.bot, target);
    const craftTorch = createCraftTorchState(this.bot, target);
    const craftHoe = createCraftHoeState(this.bot, target);
    const craftPickaxe = createCraftPickaxeState(this.bot, target);
    const burnCharcoal = createBurnCharcoalState(this.bot, target);
    const feedChicken = createFeedChickenState(this.bot, target);
    const craftAxe = createCraftAxeState(this.bot, target);
    const feedPig = createFeedPigState(this.bot, target);
    const craftStick = createCraftStickState(this.bot, target);
    const woodTransform = createWoodTransformState(this.bot, target);
    const askForHelp = new BehaviorAskForHelp(this.bot, target);
    const plantTree = new createPlantTreeState(this.bot, target);

    return [
      new StateTransition({
        parent: idleState, // The state to move from
        child: moveOutMine, // The state to move to
        shouldTransition: () => {
          if(shouldTransition(this, BOT_JOB_TYPE.MINE))
            return false;
          const range = 1.5;
          const position = this.bot.entity.position;
          const center = target.mine_center;
          if (center == null)
            return false;
          return Math.abs(position.x - center.x) <= range && Math.abs(position.z - center.z) <= range;
        }, // When this should happen
        onTransition: () => {
          target.position = target.mine_center.offset(-2, 0, 0);
          while (this.bot.blockAt(target.position).name != "air")
            target.position.y++;
        }
      }),
      new StateTransition({
        parent: moveOutMine, // The state to move from
        child: idleState, // The state to move to
        shouldTransition: () => moveOutMine.isFinished(), // When this should happen
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({
        parent: idleState, // The state to move from
        child: mining, // The state to move to
        jobID: BOT_JOB_TYPE.MINING, // The job ID : 16
      }, this),
      new StateTransition({
        parent: mining, // The state to move from
        child: idleState, // The state to move to
        shouldTransition: () => mining.isFinished(), // When this should happen
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({
        parent: idleState, // The state to move from
        child: kill, // The state to move to
        jobID: BOT_JOB_TYPE.KILL, // The job ID : 23
      }, this),
      new StateTransition({
        parent: kill, // The state to move from
        child: idleState, // The state to move to
        shouldTransition: () => kill.isFinished(), // When this should happen
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({
        parent: idleState, // The state to move from
        child: goHome, // The state to move to
        jobID: BOT_JOB_TYPE.GOHOME, // The job ID : 1
      }, this),
      new StateTransition({
        parent: goHome, // The state to move from
        child: idleState, // The state to move to
        shouldTransition: () => goHome.isFinished(), // When this should happen
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({
        parent: idleState, // The state to move from
        child: fishing, // The state to move to
        jobID: BOT_JOB_TYPE.FISHING, // The job ID : 15
      }, this),
      new StateTransition({
        parent: fishing, // The state to move from
        child: idleState, // The state to move to
        shouldTransition: () => fishing.isFinished(), // When this should happen
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: DropItem,
        jobID: BOT_JOB_TYPE.DROP_ENTITY, // The job ID : 13
      }, this),
      new StateTransition({   
        parent: DropItem,
        child: idleState,
        shouldTransition: () => DropItem.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: harvest,
        jobID: BOT_JOB_TYPE.HARVEST, // The job ID : 2
      }, this),
      new StateTransition({   
        parent: harvest,
        child: idleState,
        shouldTransition: () => harvest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: idlefortimes,
        jobID: BOT_JOB_TYPE.IDLE, // The job ID : 18
      }, this),
      new StateTransition({   
        parent: idlefortimes,
        child: idleState,
        shouldTransition: () => idlefortimes.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: sow,
        jobID: BOT_JOB_TYPE.SOW, // The job ID : 19
      }, this),
      new StateTransition({   
        parent: sow,
        child: idleState,
        shouldTransition: () => sow.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: craftbread,
        jobID: BOT_JOB_TYPE.CRAFT_BREAD, // The job ID : 12
      }, this),
      new StateTransition({   
        parent: craftbread,
        child: idleState,
        shouldTransition: () => craftbread.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: sleep,
        jobID: BOT_JOB_TYPE.SLEEP, // The job ID : 5
      }, this),
      new StateTransition({   
        parent: sleep,
        child: idleState,
        shouldTransition: () => sleep.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: wakeup,
        jobID: BOT_JOB_TYPE.WAKEUP, // The job ID : 24
      }, this),
      new StateTransition({   
        parent: wakeup,
        child: idleState,
        shouldTransition: () => wakeup.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: go_guild,
        jobID: BOT_JOB_TYPE.GOGUILD, // The job ID : 10
      }, this),
      new StateTransition({   
        parent: go_guild,
        child: idleState,
        shouldTransition: () => go_guild.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: go_farmland,
        jobID: BOT_JOB_TYPE.GOFARM, // The job ID : 9
      }, this),
      new StateTransition({   
        parent: go_farmland,
        child: idleState,
        shouldTransition: () => go_farmland.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: followPlayer,
        jobID: BOT_JOB_TYPE.FOLLOWPLAYER, // The job ID : 0
      }, this),
      new StateTransition({   
        parent: followPlayer,
        child: idleState,
        shouldTransition: () => followPlayer.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: eat_bread,
        jobID: BOT_JOB_TYPE.EAT, // The job ID : 6
      }, this),
      new StateTransition({   
        parent: eat_bread,
        child: idleState,
        shouldTransition: () => eat_bread.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findfoodfromchest,
        jobID: BOT_JOB_TYPE.FIND_FOOD, // The job ID : 8
      }, this),
      new StateTransition({   
        parent: findfoodfromchest,
        child: idleState,
        shouldTransition: () => findfoodfromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findseedfromchest,
        jobID: BOT_JOB_TYPE.FIND_WHEAT_SEEDS, // The job ID : 41
      }, this),
      new StateTransition({   
        parent: findseedfromchest,
        child: idleState,
        shouldTransition: () => findseedfromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findcarrotfromchest,
        jobID: BOT_JOB_TYPE.FIND_CARROT, // The job ID : 42
      }, this),
      new StateTransition({   
        parent: findcarrotfromchest,
        child: idleState,
        shouldTransition: () => findcarrotfromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findcharcoalfromchest,
        jobID: BOT_JOB_TYPE.FIND_CHARCOAL, // The job ID : 43
      }, this),
      new StateTransition({   
        parent: findcharcoalfromchest,
        child: idleState,
        shouldTransition: () => findcharcoalfromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findcoalfromchest,
        jobID: BOT_JOB_TYPE.FIND_COAL, // The job ID : 44
      }, this),
      new StateTransition({   
        parent: findcoalfromchest,
        child: idleState,
        shouldTransition: () => findcoalfromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findcobblestonefromchest,
        jobID: BOT_JOB_TYPE.FIND_COBBLESTONE, // The job ID : 45
      }, this),
      new StateTransition({   
        parent: findcobblestonefromchest,
        child: idleState,
        shouldTransition: () => findcobblestonefromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findfishing_rodfromchest,
        jobID: BOT_JOB_TYPE.FIND_FISHING_ROD, // The job ID : 46
      }, this),
      new StateTransition({   
        parent: findfishing_rodfromchest,
        child: idleState,
        shouldTransition: () => findfishing_rodfromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findladderfromchest,
        jobID: BOT_JOB_TYPE.FIND_LADDER, // The job ID : 47
      }, this),
      new StateTransition({   
        parent: findladderfromchest,
        child: idleState,
        shouldTransition: () => findladderfromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findoak_saplingfromchest,
        jobID: BOT_JOB_TYPE.FIND_OAK_SAPLING, // The job ID : 48
      }, this),
      new StateTransition({   
        parent: findoak_saplingfromchest,
        child: idleState,
        shouldTransition: () => findoak_saplingfromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findoak_logfromchest,
        jobID: BOT_JOB_TYPE.FIND_OAK_LOG, // The job ID : 49
      }, this),
      new StateTransition({   
        parent: findoak_logfromchest,
        child: idleState,
        shouldTransition: () => findoak_logfromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findoak_planksfromchest,
        jobID: BOT_JOB_TYPE.FIND_OAK_PLANKS, // The job ID : 50
      }, this),
      new StateTransition({   
        parent: findoak_planksfromchest,
        child: idleState,
        shouldTransition: () => findoak_planksfromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findstickfromchest,
        jobID: BOT_JOB_TYPE.FIND_STICK, // The job ID : 51
      }, this),
      new StateTransition({   
        parent: findstickfromchest,
        child: idleState,
        shouldTransition: () => findstickfromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),

new BotStateTransition({   
        parent: idleState,
        child: findstone_axefromchest,
        jobID: BOT_JOB_TYPE.FIND_STONE_AXE, // The job ID : 52
      }, this),
      new StateTransition({   
        parent: findstone_axefromchest,
        child: idleState,
        shouldTransition: () => findstone_axefromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findstone_hoefromchest,
        jobID: BOT_JOB_TYPE.FIND_STONE_HOE, // The job ID : 53
      }, this),
      new StateTransition({   
        parent: findstone_hoefromchest,
        child: idleState,
        shouldTransition: () => findstone_hoefromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findstone_pickaxefromchest,
        jobID: BOT_JOB_TYPE.FIND_STONE_PICKAXE, // The job ID : 54
      }, this),
      new StateTransition({   
        parent: findstone_pickaxefromchest,
        child: idleState,
        shouldTransition: () => findstone_pickaxefromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findstone_swordfromchest,
        jobID: BOT_JOB_TYPE.FIND_STONE_SWORD, // The job ID : 55
      }, this),
      new StateTransition({   
        parent: findstone_swordfromchest,
        child: idleState,
        shouldTransition: () => findseedfromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findwheatfromchest,
        jobID: BOT_JOB_TYPE.FIND_WHEAT, // The job ID : 56
      }, this),
      new StateTransition({   
        parent: findwheatfromchest,
        child: idleState,
        shouldTransition: () => findwheatfromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findwooden_axefromchest,
        jobID: BOT_JOB_TYPE.FIND_WOODEN_AXE, // The job ID : 57
      }, this),
      new StateTransition({   
        parent: findWooden_axe,
        child: idleState,
        shouldTransition: () => findWooden_axe.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findwooden_hoefromchest,
        jobID: BOT_JOB_TYPE.FIND_WOODEN_HOE, // The job ID : 58
      }, this),
      new StateTransition({   
        parent: findwooden_hoefromchest,
        child: idleState,
        shouldTransition: () => findwooden_hoefromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: findwoodden_pickaxefromchest,
        jobID: BOT_JOB_TYPE.FIND_WOODEN_PICKAXE, // The job ID : 59
      }, this),
      new StateTransition({   
        parent: findwoodden_pickaxefromchest,
        child: idleState,
        shouldTransition: () => findwoodden_pickaxefromchest.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: putTool,
        jobID: BOT_JOB_TYPE.PUT_TOOLS_BACK_TO_CHEST, // The job ID : 3
      }, this),
      new StateTransition({   
        parent: putTool,
        child: idleState,
        shouldTransition: () => putTool.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: cutDownTree,
        jobID: BOT_JOB_TYPE.CUTDOWNTREE, // The job ID : 21
      }, this),
      new StateTransition({   
        parent: cutDownTree,
        child: idleState,
        shouldTransition: () => cutDownTree.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: craftTorch,
        jobID: BOT_JOB_TYPE.CRAFT_TORCH, // The job ID : 32
      }, this),
      new StateTransition({   
        parent: craftTorch,
        child: idleState,
        shouldTransition: () => craftTorch.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: craftHoe,
        jobID: BOT_JOB_TYPE.CRAFT_HOE, // The job ID : 29
      }, this),
      new StateTransition({   
        parent: craftHoe,
        child: idleState,
        shouldTransition: () => craftHoe.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: craftPickaxe,
        jobID: BOT_JOB_TYPE.CRAFT_PICKAXE, // The job ID : 27
      }, this),
      new StateTransition({   
        parent: craftPickaxe,
        child: idleState,
        shouldTransition: () => craftPickaxe.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: burnCharcoal,
        jobID: BOT_JOB_TYPE.BURN_CHARCOAL, // The job ID : 31
      }, this),
      new StateTransition({   
        parent: burnCharcoal,
        child: idleState,
        shouldTransition: () => burnCharcoal.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: feedChicken,
        jobID: BOT_JOB_TYPE.FEEDCHICKEN, // The job ID : 17
      }, this),
      new StateTransition({   
        parent: feedChicken,
        child: idleState,
        shouldTransition: () => feedChicken.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: feedPig,
        jobID: BOT_JOB_TYPE.FEEDPIG, // The job ID : 28
      }, this),
      new StateTransition({   
        parent: feedPig,
        child: idleState,
        shouldTransition: () => feedPig.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: craftAxe,
        jobID: BOT_JOB_TYPE.CRAFT_AXE, // The job ID : 33
      }, this),
      new StateTransition({   
        parent: craftAxe,
        child: idleState,
        shouldTransition: () => craftAxe.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: craftStick,
        jobID: BOT_JOB_TYPE.CRAFT_STICK, // The job ID : 34
      }, this),
      new StateTransition({   
        parent: craftStick,
        child: idleState,
        shouldTransition: () => craftStick.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: woodTransform,
        jobID: BOT_JOB_TYPE.WOODTRANSFORM, // The job ID : 35
      }, this),
      new StateTransition({   
        parent: woodTransform,
        child: idleState,
        shouldTransition: () => woodTransform.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: askForHelp,
        jobID: BOT_JOB_TYPE.ASKFORHELP, // The job ID : 40
      }, this),
      new StateTransition({   
        parent: askForHelp,
        child: idleState,
        shouldTransition: () => askForHelp.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),
      new StateTransition({
        parent: idleState, // The state to move from
        child: idleState, // The state to move to
        shouldTransition: () => this.job != "", // When this should happen
        onTransition: () => {
          this.job = "";
        }
      }),
      new BotStateTransition({
        parent: idleState, // The state to move from
        child: goFarm, // The state to move to
        jobID: BOT_JOB_TYPE.GOFARM, // The job ID : 9
      }, this),
      new StateTransition({
        parent: goFarm, // The state to move from
        child: idleState, // The state to move to
        shouldTransition: () => goFarm.isFinished(), // When this should happen
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({
        parent: idleState, // The state to move from
        child: goLoggingCamp, // The state to move to
        jobID: BOT_JOB_TYPE.GOLOGGINGCAMP, // The job ID : 26
      }, this),
      new StateTransition({
        parent: goLoggingCamp, // The state to move from
        child: idleState, // The state to move to
        shouldTransition: () => goLoggingCamp.isFinished(), // When this should happen
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({
        parent: idleState, // The state to move from
        child: goSmeltingPlant, // The state to move to
        jobID: BOT_JOB_TYPE.GOSMELTINGPLANT, // The job ID : 36
      }, this),
      new StateTransition({
        parent: goSmeltingPlant, // The state to move from
        child: idleState, // The state to move to
        shouldTransition: () => goSmeltingPlant.isFinished(), // When this should happen
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({
        parent: idleState, // The state to move from
        child: goPoultryFarm, // The state to move to
        jobID: BOT_JOB_TYPE.GOPOULTRYFARM, // The job ID : 37
      }, this),
      new StateTransition({
        parent: goPoultryFarm, // The state to move from
        child: idleState, // The state to move to
        shouldTransition: () => goPoultryFarm.isFinished(), // When this should happen
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({
        parent: idleState, // The state to move from
        child: goPigpen, // The state to move to
        jobID: BOT_JOB_TYPE.GOPIGEON, // The job ID : 38
      }, this),
      new StateTransition({
        parent: goPigpen, // The state to move from
        child: idleState, // The state to move to
        shouldTransition: () => goPigpen.isFinished(), // When this should happen
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({
        parent: idleState, // The state to move from
        child: goPond, // The state to move to
        jobID: BOT_JOB_TYPE.GOPOND // The job ID : 39
      }, this),
      new StateTransition({
        parent: goPond, // The state to move from
        child: idleState, // The state to move to
        shouldTransition: () => goPond.isFinished(), // When this should happen
        onTransition: () => this.JobCheck(true)
      }),
      new BotStateTransition({   
        parent: idleState,
        child: plantTree,
        jobID: BOT_JOB_TYPE.PLANT_TREE, // The job ID : 60
      }, this),
      new StateTransition({   
        parent: plantTree,
        child: idleState,
        shouldTransition: () => plantTree.isFinished(),
        onTransition: () => this.JobCheck(true)
      }),

    ];
  }






  // Init bot events
  initEvents() {
      this.socket.on('connect', () => {
      
        this.socket.on('mine', (data) => {   // receiver
            if(data.receiverName != this.bot.username)return
            this.lastPlayer = data['sender']
        
            if(data.hasOwnProperty("job")){
              this.JobQueue.push(parseInt(data.job))
              this.bot.agentState = data['agentState']
              
            }
            if(data.hasOwnProperty("choice")){
              this.bot.prev_jobs.push(data.choice)
              this.bot.agentState = data['agentState']
              
            }
            if(data.hasOwnProperty("request_id")){
              if(data.state == "waiting"){
                this.bot.chat("/quests finish imlililili "+data['request_id'].toString())
                console.log(data['request_id'].toString())
              }else{
                this.bot.chat("/quests start imlililili "+toString(data['request_id']) )
              }
              
            }
            if(data.hasOwnProperty("message")){
              this.bot.chat(data.message)
            }
            
            

          });
  
          this.socket.on('disconnect', () => {
            console.log('A client disconnected.');
          });
    
        });
 
      }
     }
     



     io.on("connection", (socket) => {
      console.log('A client connected.');
      
      socket.on('message', (data) => {
        console.log('Received message from Node client:', data);
        
        io.emit(data.receiverName, data);
        
  
      });
      socket.on('agi', (data) => {
        console.log('Received message from agi client:', data);
        
        io.emit('mine', data);
     
        io.emit('voice', data);
      });
  
      socket.on('disconnect', () => {
        console.log('A client disconnected.');
      });
  
});


  
let bots = [];
let i = 0

  const fun = (Agent_instance) => {
    return new Promise(resolve => {
      bots.push(new MCBot(Agent_instance,i++))
      setTimeout(() =>
        resolve(`done ${Agent_instance}`), 5000);
    })
  }
  
  const go = async () => {
    
    for (const Agent_instance of Agent) {
      console.log(Agent_instance)
      console.log(await fun(Agent_instance))
    }
    console.log('done all')
  }
  
go()
  
