import os
from agent import agent
from agent_quest import agent_quest
from dotenv import load_dotenv
import urllib3
import socketio
import threading
import time
# from nono import curr_plan
# Load default environment variables (.env)
load_dotenv()
from agent_state import messageType
from agent_state import state
sio = socketio.Client()

# Jeff_instance = agent('Jeff')
Diedie_instance = agent('diedie')
guild_instance = agent_quest('guild')
@sio.event
def connect():
    print('Connected to Node.js server.')
# @sio.on("Jeff")
# def message(data):
#     if 'sender' in data:
#         if data['sender'] == "Dingo_Kez":
#             data['sender'] = 'Dingo'
#     if(data=="plan"):
#         taskID = str(9999)
#         print(taskID)
#         sio.emit(Jeff_instance.action(data, taskID))
#     elif data['message'] == 'reload':
#         Jeff_instance.reload_sentence_file()
#     elif data['message'] == 'save':
#         Jeff_instance.save_Memory_file()
#         Jeff_instance.save_DailyRecord_file()
#         Jeff_instance.save_day_count()
#     elif data['message'].startswith('info:') :
#         temp,word = data['message'].split(':')
#         Jeff_instance.information_thought(word,data)
#     elif data['message'].startswith('re') :
#         Jeff_instance.Reflact()
#     elif data['message'] == 'system:time':
#         Jeff_instance.update_current_schedule(data)
#     elif data['message'].startswith('observe:') :
#         temp,word = data['message'].split(':')
#         data['message'],data['actionID'] =  Jeff_instance.observation_action(word,data)
#         sio.emit('jeff_agi',data)
#     elif data['receiverName'] == "Jeff":
#         print('Received message from server:', data)

#         print(data['receiverName']+ "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
#         data['message'],data['actionID'] = Jeff_instance.action(data['message'], data)
#         sio.emit('agi',data)

@sio.on("diedie")
def message_diedie(data):
    if 'sender' in data:
        if data['sender'] == "Dingo_Kez":
            data['sender'] = 'Dingo'
        elif data['sender'] == "imlililili":
            data['sender'] = 'Lili'

    if 'message' in data:
        if data['message'] == 'skipjob':
            return
    
    match data['type']:

        case messageType.chat:
            if data['message'] == 'save':
                Diedie_instance.save_Memory_file()
                Diedie_instance.save_DailyRecord_file()
                Diedie_instance.save_day_count()
                guild_instance.save__requestState()
                return
            if data['message'].startswith('re') :
                Diedie_instance.Reflact()
                return
            if data['message'] == 'action':
                Diedie_instance.schedule_action(data)
                return
            if data['message'].startswith('job:'):
                    temp,job = data['message'].split(':')
                    Diedie_instance.update_Job_queue(int(job))
                    Diedie_instance.agent_state = state.schedule
                    return
            if data['receiverName'] == "diedie":
                print('Received message from server:', data)
                
                print(data['receiverName']+ "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                data['message'] = Diedie_instance.action(data['message'], data)

                sio.emit('agi',data)
      
         
        case messageType.system:
            if data['message'] == 'system:time':
                Diedie_instance.update_current_schedule(data)
                # Diedie_instance.schedule_action()
            if data['message'] == 'system:JobFinish':
                Diedie_instance.update_Job_state(data)
 
        case messageType.observe:

            if 'match_item' in data:
                quest = guild_instance.check_requestState(data['receiverName'],data['item_name'],data['item_id'])
                if quest['state'] == True :
                    data['message'] = Diedie_instance.action("Give you the "+data['item_name']+"for your request", data)
                    data['state'] = "waiting"
                    data['request_id'] = quest['request_id'] 
                    sio.emit('agi',data)
                    guild_instance.disable_requestState(data['receiverName'],data['item_name'])
                    print("???")
            else:
                match data['agentState']:
                    
                    case state.chat:
                        data['message'] = Diedie_instance.observation_chat(data)
                        data['receiverName'] = 'diedie'
                        sio.emit('agi',data)
                    case state.schedule:
                        # guild_instance.enable_requestState(data['receiverName'],data['item_name'])
                        data['message'] = Diedie_instance.backup(data)
                        sio.emit('agi', data)

                        
                  
         

@sio.on("Guild")
def message_guild(data):
    if 'sender' in data:
        if data['sender'] == "Dingo_Kez":
            data['sender'] = 'Dingo'
        elif data['sender'] == "imlililili":
            data['sender'] = 'Lili'

    if 'message' in data:
        if data['message'] == 'skipjob':
            return
    print("????")
    match data['type']:

        case messageType.chat:
            # if data['message'] == 'save':
            #     Diedie_instance.save_Memory_file()
            #     Diedie_instance.save_DailyRecord_file()
            #     Diedie_instance.save_day_count()
            #     return
            # if data['message'].startswith('re') :
            #     Diedie_instance.Reflact()
            #     return
            # if data['message'] == 'action':
            #     Diedie_instance.schedule_action(data)
            #     return
            # if data['message'].startswith('job:'):
            #         temp,job = data['message'].split(':')
            #         Diedie_instance.update_Job_queue(int(job))
            #         return
            if data['receiverName'] == "Guild":
                print('Received message from server:', data)
                
                print(data['receiverName']+ "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                # data['message'] = guild_instance.action(data)
                guild_instance.request(data)
                sio.emit('agi',data)
      
         
        case messageType.system:
            if data['message'] == 'system:time':
                Diedie_instance.update_current_schedule(data)
            if data['message'] == 'system:JobFinish':
                Diedie_instance.update_Job_state(data)

            
@sio.event
def disconnect():
    print('Disconnected from Node.js server.')
    # Jeff_instance.save_Memory_file()
    # Jeff_instance.save_DailyRecord_file()
    # Jeff_instance.save_day_count()
    Diedie_instance.save_Memory_file()
    Diedie_instance.save_DailyRecord_file()
    Diedie_instance.save_day_count()
    guild_instance.save__requestState()
    print('data is saved')
    # return

sio.connect('http://localhost:3000')
sio.wait()
