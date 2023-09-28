const getTime = require("./getRealtime.js");
function sound(bot,soundId) {
    var str = ""
    switch (soundId) {
        case 323:
            bot.chat(getTime(bot.time.timeOfDay)+bot.username + "hear grass step")
            str = getTime(bot.time.timeOfDay)+" ("+bot.username + "): hear grass step"
            break;
        case 611:
            bot.chat(getTime(bot.time.timeOfDay)+bot.username + "hear pig ambient")
            str = getTime(bot.time.timeOfDay)+" ("+bot.username + "): hear pig ambient"
            break;
        case 615:
            bot.chat(getTime(bot.time.timeOfDay)+bot.username + "hear pig step")
            str = getTime(bot.time.timeOfDay)+" ("+bot.username + "): hear pig step"
            break;
        case 656:
            bot.chat(getTime(bot.time.timeOfDay)+bot.username + "hear someone swim")
            str = getTime(bot.time.timeOfDay)+" ("+bot.username + "): hear someone swim"
            break;
        case 654:
            bot.chat(getTime(bot.time.timeOfDay)+bot.username + "hear water splashing")
            str = getTime(bot.time.timeOfDay)+" ("+bot.username + "): hear water splashing"
            break;
        case 954:
            bot.chat(getTime(bot.time.timeOfDay)+bot.username + "hear wood place")
            str = getTime(bot.time.timeOfDay)+" ("+bot.username + "): hear wood place"
            break; // wood place
        case 717:
            bot.chat(getTime(bot.time.timeOfDay)+bot.username + "hear sheep ambient")
            str = getTime(bot.time.timeOfDay)+" ("+bot.username + "): hear sheep ambient"
            break; // wood place
        case 721:
            bot.chat(getTime(bot.time.timeOfDay) +bot.username + "hear sheep step")
            str = getTime(bot.time.timeOfDay)+" ("+bot.username + "): hear sheep step"
            break; // wood place
        case 876:
            bot.chat(getTime(bot.time.timeOfDay)+bot.username + "hear villager ambient")
            str = getTime(bot.time.timeOfDay)+" ("+bot.username + "): hear villager ambient"
            break; // villager ambient
        case 957:
            bot.chat(getTime(bot.time.timeOfDay)+bot.username + "hear sheep step")
            str = getTime(bot.time.timeOfDay)+" ("+bot.username + "): hear sheep step"
                break; // wood place
        default:
            bot.chat(getTime(bot.time.timeOfDay)+bot.username + soundId)
            str = getTime(bot.time.timeOfDay)+" ("+bot.username + "): hear undefined sound"
        
    }
    var fs = require('fs');
 
    fs.appendFile('test.txt', str + '\n', function (err) {
        if (err)
            console.log(err);
    });

}
module.exports = sound;