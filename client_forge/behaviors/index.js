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
};