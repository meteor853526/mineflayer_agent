function getRealtime(timeOfDay) {
    AmOrPm = 'AM'
    mint = parseInt(timeOfDay/16)
    hour = (parseInt(mint/60) + 6) % 24
    if(hour >= 12){
        AmOrPm = 'PM'
        hour -= 12
    }
    mint = parseInt(mint%60)
    return hour + " : " + mint +" " + AmOrPm
}

function getWheather(NotRaining) {
    if(NotRaining){
        return 'fine'
    }else{
        return 'raining'
    }
}
function getDistance(center_A,center_B,entity) {

    let A = entity.position.x
    let B = entity.position.z
    let abs_A = Math.abs(A-center_A)
    let abs_B = Math.abs(B-center_B)
    let distance = Math.sqrt(abs_A*abs_A + abs_B*abs_B)
    return distance
}

async function relocate(bot){
    // console.log(this.bot.entity)

 
    if(getDistance(bot.diedie_home_centerPos.x,bot.diedie_home_centerPos.z,bot.entity) < 5 ){
      bot.pos = "diedie's home"
      return "diedie's home"
    }
    if(getDistance(bot.diedie_farm_centerPos.x,bot.diedie_farm_centerPos.z,bot.entity) < 10 ){
      bot.pos = "diedie's farm"
      return "diedie's farm"
    }

    if(getDistance(bot.guild_position.x,bot.guild_position.z,bot.entity) < 8 ){
        bot.pos = "guild"
        return "guild"
    }
    return 'outside'
}

function playerdistance(bot,targetName){

    var botPosition;
    var targetPosition;

    Object.entries(bot.entities).forEach(mob => {
        const [key, value] = mob;
        if(value.type == "player" && value.username == bot.username){
            botPosition = value.position
        }
        if(value.type == "player" && value.username == targetName){
            targetPosition = value
        }

    });
    return Math.round(getDistance(botPosition.x,botPosition.z,targetPosition))
}

exports.getDistance = getDistance
exports.getRealtime = getRealtime
exports.getWheather = getWheather
exports.relocate = relocate
exports.playerdistance = playerdistance