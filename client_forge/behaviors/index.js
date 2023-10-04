const goHome = require('./go_home');
const killing = require('./killing');
const mining = require('./mining');
const fishing = require('./fishing');
const dropItem = require('./dropItem');
const harvest = require('./Harvest');
const cutDownTree = require('./CutDownTree');
const craftTorch = require('./CraftTorch');
const craftHoe = require('./CraftHoe');
const craftPickaxe = require('./CraftPickaxe');
const burnCharcoal = require('./BurnCharcoal');
const craftAxe = require('./CraftAxe');
const feedChicken = require('./FeedChicken');
const feedPig = require('./FeedPig');
const craftStick = require('./CraftStick');
const woodTransform = require('./WoodTransform');
const idleforsometime = require('./idleforsometime')
const sow = require('./Sow')
const follow = require('./followPlayer')
const craftBread = require('./craftBread')
const sleep = require('./sleep')
const wakeup = require('./wake_up')
const go_guild = require('./go_guild')
const go_farm = require('./go_farmland')
const eat = require('./eat')
const findfood = require('./findFood')
const putToolBackToChest = require('./putToolBacktoChest')
const askForHelp = require('./AskForHelp')


module.exports = {
    ...goHome,
    ...killing,
    ...mining,
    ...fishing,
    ...dropItem,
    ...harvest,
    ...cutDownTree,
    ...craftTorch,
    ...craftHoe,
    ...craftPickaxe,
    ...burnCharcoal,
    ...craftAxe,
    ...feedChicken,
    ...feedPig,
    ...craftStick,
    ...woodTransform,
    ...idleforsometime,
    ...sow,
    ...follow,
    ...craftBread,
    ...sleep,
    ...wakeup,
    ...go_guild,
    ...go_farm,
    ...eat,
    ...findfood,
    ...putToolBackToChest,
    ...askForHelp,




};