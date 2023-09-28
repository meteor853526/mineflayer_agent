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

    console.log(getDistance(bot.diedie_home_centerPos.x,bot.diedie_home_centerPos.z,bot.entity))
    console.log(getDistance(bot.diedie_farm_centerPos.x,bot.diedie_farm_centerPos.z,bot.entity))
    if(getDistance(bot.diedie_home_centerPos.x,bot.diedie_home_centerPos.z,bot.entity) < bot.diedie_home_radius ){
      bot.pos = "diedie's home"
      return "diedie's home"
    }
    if(getDistance(bot.diedie_farm_centerPos.x,bot.diedie_farm_centerPos.z,bot.entity) < bot.diedie_farm_radius ){
      bot.pos = "diedie's farm"
      return 
    }
  }

// export {getDistance};
// export {getRealtime};
// export {getWheather};

exports.getDistance = getDistance
exports.getRealtime = getRealtime
exports.getWheather = getWheather
exports.relocate = relocate