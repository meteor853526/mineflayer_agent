const socketIOClient = require('socket.io-client');
const serverURL = 'http://localhost:3000'; 
const getWheather = require('./getRealtime.js').getWheather;
const getDistance = require('./getRealtime.js').getDistance;
const getRealtime = require("./getRealtime.js").getRealtime;
const relocate = require("./getRealtime.js").relocate;
const playerdistance = require("./getRealtime.js").playerdistance;
class Sensor {



    mcData = require('minecraft-data')('1.16.5')
    // ids = this.mcData.itemsByName['chest'].id

    stone_hoe_id = this.mcData.itemsByName['stone_hoe'].id
    wheat_seeds_id = this.mcData.itemsByName['wheat_seeds'].id
    wooden_axe_id = this.mcData.itemsByName['wooden_axe'].id
    bread_id = this.mcData.itemsByName['bread'].id
    wheat_id = this.mcData.itemsByName['wheat'].id
    carrot_id = this.mcData.itemsByName['carrot'].id
    

    item_dict = { }
    

    constructor(bot) {
        this.bot = bot;
        this.init_sensor()
        this.item_dict[this.stone_hoe_id] = 'stone_hoe'
        this.item_dict[this.wheat_seeds_id] = 'wheat_seeds'
        this.item_dict[this.wooden_axe_id] = 'wooden_axe'
        this.item_dict[this.bread_id] = 'bread'
        this.item_dict[this.wheat_id] = 'wheat'
        this.item_dict[this.carrot_id] = 'carrot'
    }

    init_sensor(){
        const socket = socketIOClient(serverURL);

        // this.bot.on('rain',async () => {
        //     console.log("rain????????????");
        //     await relocate(this.bot)
        //     socket.emit('message', {
        //         targetSocketId: 'TARGET_SOCKET_ID',
        //         message:'observe:outdoors is rainy.',
        //         receiverName: this.bot.username,
        //         time:getRealtime(this.bot.time.timeOfDay),
        //         wheather:getWheather(this.bot.isRaining),
        //         position:this.bot.pos,
        //     });
        // })
        // this.bot.on('playerCollect',async (collector,collected) => {
        //     if(collector.username != this.bot.username)return 
        //     var lastIndex = collected.metadata.length - 1
        //     var item_info = collected.metadata[lastIndex]
        //     var item_id = item_info['itemId']

        //     if ( item_id in this.item_dict)  {
        //         console.log("item get")

        //         socket.emit('message', {
        //             targetSocketId: 'TARGET_SOCKET_ID',
        //             message:"item_match",
        //             sender:'Dingo',
        //             match_item:true,
        //             receiverName: this.bot.username,
        //             time:getRealtime(this.bot.time.timeOfDay),
        //             wheather:getWheather(this.bot.isRaining),
        //             position:this.bot.pos,
        //             type:"observe",
        //             item_id : item_id,
        //             item_name : this.item_dict[item_id]
        //         });
        //     } 
        // })
        // this.bot.on('entitySwingArm',async (entity) => {
        //     console.log(entity)
        
        // })
        this.bot.on('whisper', async (username,message) => {

            await relocate(this.bot);
            socket.emit('message', {
                targetSocketId: 'TARGET_SOCKET_ID',
                message:message,
                sender:username,
                receiverName: this.bot.username,
                time:getRealtime(this.bot.time.timeOfDay),
                wheather:getWheather(this.bot.isRaining),
                position:this.bot.pos,
                //playerdistance:playerdistance(this.bot,username),
                playerdistance:10,
                type:"chat"
            });
            this.bot.current_talker = username
        });
        this.bot.on('spawn', async () => {
            this.bot.chat("Hello!");
        });
        this.bot._client.on('sound_effect', (packet) => {
            // const soundId = packet.soundId
            // const soundCategory = packet.soundCategory
            // const pt = new Vec3(packet.x / 8, packet.y / 8, packet.z / 8)
            // const volume = packet.volume
            // const pitch = packet.pitch
            // sound(this.bot,packet.soundId)
            //console.log( packet);
            // bot.emit('hardcodedSoundEffectHeard', soundId, soundCategory, pt, volume, pitch)
          })
        this.bot.on('entitySleep', (entity) => {
            console.log( entity.username + "entitySleep");
            //writeTxt(getRealtime(this.bot.time.timeOfDay)+"("+this.bot.username + "): see " + entity.username + " sleeping")
        })
        this.bot.on('entityWake', (entity) => {
            console.log("entityWake");
            
            //writeTxt(getRealtime(this.bot.time.timeOfDay)+"("+this.bot.username + "): see " + entity.username + " wake")
          })
        this.bot.on('entityEat', (entity) => {
            console.log("entityEat");
            //writeTxt(getRealtime(this.bot.time.timeOfDay)+"("+this.bot.username + "): see " + entity.username + " eating")
        })
        this.bot.on('rain', () => {
            console.log("rain");
            //writeTxt(getRealtime(this.bot.time.timeOfDay)+"("+this.bot.username + "): see raining")
        })

        this.bot.on('end', (reason) => {
            console.log(`[${this.username}] Disconnected: ${reason}`);
            if (reason == "disconnect.quitting") {
                return
            }
            // Attempt to reconnect
        });
        this.bot.on('chat', (username,message) => {
            if(username == this.bot.username)return 
            if(message == 'test'){
              console.log(this.bot.isRaining);
            }
          });
        this.bot.on('error', (err) => {
            if (err.code == 'ECONNREFUSED') {
                console.log(`[${this.username}] Failed to connect to ${err.address}:${err.port}`)
            }
            else {
                console.log(`[${this.username}] Unhandled error: ${err}`);
            }
        });
      // this.bot.on('chat', async (username,message) => {
      //   if(username == this.bot.username)return 
      //   this.bot.chat(message);
      //   this.ChatSignal = true
      //   if(this.ChatLock == false){
      //     JobQueue.unshift(0) // npc chat and looking at player 
      //     this.ChatLock = true
      //   }
        
      // });
      // this.bot.isRaining => false, raining
      // this.bot.isRaining => true, sun

      
      // this.bot.on('blockUpdate', (oldBlock,newBlock) => {
      //   if(this.bot.username != "diedie")return
      //   //console.log(oldBlock);
      //   if(newBlock.name == 'wheat' && newBlock._properties.age == 7){
      //     console.log("~!!!!!!!")
      //     JobQueue.push(2)
      //   }else{
      //     return 
      //   }
      //   console.log(newBlock);
      // })
      this.bot.on('time', () => {
            
        //if(this.bot.time.timeOfDay > 22990 && this.bot.time.timeOfDay < 23010){
        if(this.bot.time.timeOfDay == 23000){ 
            socket.emit('message', {
                targetSocketId: 'TARGET_SOCKET_ID',
                message:'system:time',
                sender:'system',
                receiverName: this.bot.username,
                time:'5:00 am',
                wheather:getWheather(this.bot.isRaining),
                position:this.bot.pos,
                type:"system"
            });
        }
        // if(this.bot.time.timeOfDay > 2990 && this.bot.time.timeOfDay < 3010){
        if(this.bot.time.timeOfDay == 3000){
            socket.emit('message', {
                targetSocketId: 'TARGET_SOCKET_ID',
                message:'system:time',
                sender:'system',
                receiverName: this.bot.username,
                time:'9:00 am',
                wheather:getWheather(this.bot.isRaining),
                position:this.bot.pos,
                type:"system"
            });
        }
        //if(this.bot.time.timeOfDay > 5990 && this.bot.time.timeOfDay < 6010){
        if(this.bot.time.timeOfDay == 6000){
            socket.emit('message', {
                targetSocketId: 'TARGET_SOCKET_ID',
                message:'system:time',
                sender:'system',
                receiverName: this.bot.username,
                time:'00:01 pm',
                wheather:getWheather(this.bot.isRaining),
                position:this.bot.pos,
                type:"system"
            });
        }
        // if(this.bot.time.timeOfDay > 8990 && this.bot.time.timeOfDay < 9010){
        if(this.bot.time.timeOfDay == 9000){
            socket.emit('message', {
                targetSocketId: 'TARGET_SOCKET_ID',
                message:'system:time',
                sender:'system',
                receiverName: this.bot.username,
                time:'3:00 pm',
                wheather:getWheather(this.bot.isRaining),
                position:this.bot.pos,
                type:"system"
            });
        }
       // if(this.bot.time.timeOfDay > 11990 && this.bot.time.timeOfDay < 12010){
        if(this.bot.time.timeOfDay == 12000){
            socket.emit('message', {
                targetSocketId: 'TARGET_SOCKET_ID',
                message:'system:time',
                sender:'system',
                receiverName: this.bot.username,
                time:'6:00 pm',
                wheather:getWheather(this.bot.isRaining),
                position:this.bot.pos,
                type:"system"
            });
        }
        //if(this.bot.time.timeOfDay > 15990 && this.bot.time.timeOfDay < 16010){
        if(this.bot.time.timeOfDay == 16000){
            socket.emit('message', {
                targetSocketId: 'TARGET_SOCKET_ID',
                message:'system:time',
                sender:'system',
                receiverName: this.bot.username,
                time:'10:00 pm',
                wheather:getWheather(this.bot.isRaining),
                position:this.bot.pos,
                type:"system"
            });
        }    
        if(this.bot.time.timeOfDay == 0){
            if(this.bot.username == "diedie"){
                this.bot.chat("/quests start Dingo_Kez 28")
            }
        }
        })
    }





}
exports.Sensor = Sensor;
