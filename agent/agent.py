import openai
import yaml
from langchain.text_splitter import NLTKTextSplitter
import json
import threading
import signal
import time
import queue
import re
import socketio
import pandas as pd
import signal
import ast
import numpy as np
from scipy.spatial.distance import cosine
import json
from openai.embeddings_utils import get_embedding
from openai.embeddings_utils import cosine_similarity
from scipy import spatial
import pandas as pd
from agent_state import state
from agent_state import memoryType
from CountdownTimer import CountdownTimer

# �@�i����schedule�Npop
openai.api_key = "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"
sio = socketio.Client()
sio.connect('http://localhost:3000')
class agent:

    def __init__(self,name):
            self.agent_name = name
            self.agent_state = state.idle
            self.lastPlayer = ''
            self.current_schedule = ""
            self.timer = CountdownTimer(60)
            self.init_prompt_paragraph()
            self.init_observe_prompt_paragraph()
            self.init_agent_info()
            self.init_agent_memory()
            self.init_agent_dailyRecord()
            self.init_day_count()
            self.JobQueue = queue.Queue()
            self.waitingQueue = queue.Queue()
            self.JobStateFinish = True
            self.init_SendingJobToMine()
            self.property = 0
            
    def generate(self,prompt):
        try:
        #Make your OpenAI API request // gpt-3.5-turbo
            completion = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role":"system", "content": self.agent_info[self.agent_name]},
                {"role":"system", "content":"Keep your thoughts relatively simple and concise in 20 words."},
                {"role": "user", "content": prompt},
                ]
            )
            return completion.choices[0].message["content"]
        except openai.error.APIError as e:
        #Handle API error here, e.g. retry or log
            print(f"OpenAI API returned an API Error: {e}")
            pass
        except openai.error.APIConnectionError as e:
        #Handle connection error here
            print(f"Failed to connect to OpenAI API: {e}")
            pass
        except openai.error.RateLimitError as e:
        #Handle rate limit error (we recommend using exponential backoff)
            print(f"OpenAI API request exceeded rate limit: {e}")
            pass

    def generateByTurbo(self,prompt):
        try:
        #Make your OpenAI API request 
            completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role":"system", "content": self.agent_info[self.agent_name]},
                {"role": "user", "content": prompt},
                ]
            )
            return completion.choices[0].message["content"]
        except openai.error.APIError as e:
        #Handle API error here, e.g. retry or log
            print(f"OpenAI API returned an API Error: {e}")
            pass
        except openai.error.APIConnectionError as e:
        #Handle connection error here
            print(f"Failed to connect to OpenAI API: {e}")
            pass
        except openai.error.RateLimitError as e:
        #Handle rate limit error (we recommend using exponential backoff)
            print(f"OpenAI API request exceeded rate limit: {e}")
            pass
    
    
    def SendingJobToMine(self,interval):
        while True:
         
            if not self.timer.is_countdown_running() and (self.agent_state == state.chat or self.agent_state == state.schedule):
                if not self.waitingQueue.empty():
                    self.reOrderJobQueue()
                    self.agent_state = state.schedule
                elif self.JobQueue.empty():
                    self.agent_state = state.idle
                print("send:"  + self.agent_state)
            if self.JobStateFinish == True and self.JobQueue.qsize() != 0:
                id  = self.JobQueue.get()
                if id == -1:
                    self.reOrderJobQueue()
                    continue
                
                sio.emit('agi',
                    {
                        'message':"system:Job",
                        'sender':self.lastPlayer,
                        'receiverName': self.agent_name,
                        'job': id,
                        'agentState' : self.agent_state,
                    }
                )
                self.JobStateFinish = False
            #else:
                # self.agent_state = state.idle
                # self.current_schedule = "You have finish the routine "+self.current_schedule+" in this moment,"
            time.sleep(interval)
            
    def get_ada_embedding(self,text):
        text = text.replace("\n", " ")
        return openai.Embedding.create(input=[text], model="text-embedding-ada-002")[
            "data"
        ][0]["embedding"]

    def updateMemory(self,new_thought, data_type):
        vector = self.get_ada_embedding(new_thought)
        self.agent_memory[self.agent_name][data_type]["text"].append(new_thought)
        self.agent_memory[self.agent_name][data_type]["vector"].append(vector)

    def updateDailyMemory(self,memory,type):
        if type == 'chat':
            if self.day not in self.agent_dailyRecord:
                self.agent_dailyRecord[self.day] = {}
                self.agent_dailyRecord[self.day]['chat'] = []
            if 'chat' not in self.agent_dailyRecord[self.day]:
                self.agent_dailyRecord[self.day]['chat'] = []
                
            self.agent_dailyRecord[self.day]['chat'].append(memory)
        elif type == 'schedule':
            if self.day not in self.agent_dailyRecord:
                self.agent_dailyRecord[self.day] = {}
                self.agent_dailyRecord[self.day]['schedule'] = {}
            self.agent_dailyRecord[self.day]['schedule'] = memory
            
    def Reflact(self):
        allText = ""
        ReflactPrompt = self.prompt_paragraph["Reflect"]
        
        for text in self.agent_dailyRecord[self.day]['chat']:
            allText += text + "\n"
        ReflactPrompt = ReflactPrompt.replace("{dailyRecord}", allText)
        print(ReflactPrompt)
        print("-------------------------------")
        ReflactMemory = self.generateByTurbo(ReflactPrompt)
        print(ReflactMemory)
        pattern = r'^\d+\.\s+'
        lines = re.split(pattern, ReflactMemory, flags=re.MULTILINE)[1:]
        print("-------------------------------")
        for i in range(len(lines)-1):
            self.updateMemory(lines[i].strip(), memoryType.INFORMATION)
            print(lines[i].strip())
        self.schedule(lines[len(lines)-1].strip())

    def schedule(self,summary):
        SchedulePrompt = self.prompt_paragraph["schedule"]
        SchedulePrompt = SchedulePrompt.replace("{summary}", summary)
        ScheduleThought = self.generate(SchedulePrompt)
        lines = ScheduleThought.strip().split('\n')
        schedule_dict = {}
        for line in lines:
            parts = line.split(': ', 1)
            if len(parts) == 2:
                time_str = parts[0][1:-1]  
                activity = parts[1]
                schedule_dict[time_str] = activity
        self.update_day_count()
        self.updateDailyMemory(schedule_dict,'schedule')
        print(ScheduleThought)

    def schedule_action(self,data):
        ScheduleActionPrompt = self.prompt_paragraph["schedule_action"]
        ScheduleActionPrompt = ScheduleActionPrompt.replace("{current_schedule}", self.current_schedule)
        ScheduleActionPrompt = ScheduleActionPrompt.replace("{time}",data['time']).replace("{wheather}", data['wheather']).replace("{location}", 'home').replace("{property}", self.property)
        ScheduleActionThought = self.generate(ScheduleActionPrompt)

        array_match = re.search(r'\[.*\]', ScheduleActionThought)
        if array_match:
            array_str = array_match.group()
            try:
                array = ast.literal_eval(array_str)
                print(array)
            except ValueError:
                print("error")
        else:
            print("no found")
        print(ScheduleActionThought)
        
        a,b = ScheduleActionThought.split(':')
        # if b[-1] != '.':
        #     b = b[:-1]

        # text_after_colon = b
        
      
        self.putIntoJobQueue(array,state.schedule)

    def putIntoJobQueue(self,array,actionType):
 
        if self.agent_state == state.idle:
            for id in array : self.JobQueue.put(id)
            self.agent_state = actionType
        elif self.agent_state == state.chat and actionType == state.schedule:
            for id in array : self.waitingQueue.put(id)
        elif self.agent_state == state.chat and actionType == state.chat or self.agent_state == state.schedule and actionType == state.schedule:
            for id in array : self.JobQueue.put(id)
        elif self.agent_state == state.schedule and actionType == state.chat:
            while not self.JobQueue.empty():
                item = self.JobQueue.get()
                self.waitingQueue.put(item) # pop current schedule action from jobqueue

            for id in array : self.JobQueue.put(id)  # put chat action into jobqueue
        
        print("JobQueue contents:", list(self.JobQueue.queue))
        print("waitingQueue contents:", list(self.waitingQueue.queue))
        print("agent state:", self.agent_state)

    def reOrderJobQueue(self):
        if not self.waitingQueue.empty():
            self.agent_state = state.schedule
            while not self.waitingQueue.empty():
                item = self.waitingQueue.get()
                self.JobQueue.put(item) # pop current schedule action from jobqueue
        else:
            self.agent_state = state.idle
        

    def getClosestVector(self,new_vector, data_type,number):
        df = pd.DataFrame(self.agent_memory[self.agent_name][data_type])
        df["similarities"] = df['vector'].apply(lambda x: cosine_similarity(x, new_vector))
        df = df.sort_values("similarities", ascending=False)
        return df.head(number)
    
    def observation_action(self,observation,data):
        ObservationActionPrompt = self.prompt_paragraph["observation_action"]
        ObservationActionPrompt = ObservationActionPrompt.replace("{observation}", observation).replace("{time}", data['time']).replace("{wheather}", data['wheather']).replace("{location}",  data['position']).replace("{property}", self.property)
        Action = self.generate(ObservationActionPrompt)
        
        # informationthoughtMemory = self.prompt_paragraph["information_thought_memory"]
        # informationthoughtMemory = informationthoughtMemory.replace("{observation}", observation).replace("{information_thought}", informationthought)
        # print(informationthoughtMemory)
        # self.updateMemory(informationthoughtMemory, self.agent_name, memoryType.INFORMATION)
        print(Action)
        try:
            id,content = Action.split(':')
        except:
            content = Action
            id = 999
        self.updateDailyMemory(str(content),'chat')
        return str(content),id

    def observation_chat(self,data):
        ObservationChatPrompt = self.observe_prompt_paragraph["observation_chat"]
        ObservationChatPrompt = ObservationChatPrompt.replace("{player}", self.lastPlayer).replace("{chat_record}", self.lastMessage).replace("{observation}", data['observation']).replace("{property}", self.property)
        ObservationChatPrompt = ObservationChatPrompt.replace("{time}", data['time']).replace("{wheather}", data['wheather']).replace("{location}", data['position'])
        content = self.generate(ObservationChatPrompt)
        # result_list = eval(content)
        # print(result_list)
        self.updateDailyMemory('('+data['time']+') : \n'+"You found that:" + data['observation'],'chat')
        self.updateMemory("You found that:" + data['observation'],memoryType.THOUGHT)
        return content

    def information_thought(self,observation,data):
        informationthoughtPrompt = self.prompt_paragraph["information_thought"]
        informationthoughtPrompt = informationthoughtPrompt.replace("{observation}", observation).replace("{time}", data['time']).replace("{wheather}", data['wheather']).replace("{location}",  data['position']).replace("{property}", self.property)
        # informationthought = self.generate(informationthoughtPrompt)
        # informationthoughtMemory = self.prompt_paragraph["information_thought_memory"]
        # informationthoughtMemory = informationthoughtMemory.replace("{observation}", observation).replace("{information_thought}", informationthought)
        # print(informationthoughtMemory)
        self.updateDailyMemory('('+data['time']+') : \n'+observation,'chat')
        #self.updateMemory(informationthoughtMemory, memoryType.INFORMATION)

    def internalThought(self,query, query_embedding,data) -> str:
        df = pd.DataFrame(self.agent_memory[self.agent_name][memoryType.THOUGHT])
        ClosestSenderInfo = self.get_ada_embedding(data['sender'])
        ClosestInformation = self.get_ada_embedding(data['sender'] + ' say: ' + query + 'to ' + data['receiverName'])
        ClosestSenderInfoMemory = self.getClosestVector(ClosestSenderInfo, memoryType.INFORMATION,2)
        ClosestInformationMemory = self.getClosestVector(ClosestInformation, memoryType.INFORMATION,2)
        
        t = pd.concat([ClosestSenderInfoMemory, ClosestInformationMemory], axis=0)
        t = t.sort_values("similarities", ascending=False)
        top_matches = ''
        for text in t['text'].values.tolist():
            top_matches += text  + '\n\n'
  
        currentMemory = df.tail(5)
        AllMemoryText = currentMemory['text'].values.tolist()
        currentMemoryText = ""
        count = 1
        for text in AllMemoryText:
            currentMemoryText += str(count) + '. ' + text  + '\n\n'
            count += 1

        internalThoughtPrompt = self.prompt_paragraph["internal_thought"]
        internalThoughtPrompt = internalThoughtPrompt.replace("{query}", query).replace("{top_matches}", top_matches).replace("{time}", data['time']).replace("{wheather}", data['wheather']).replace("{location}",  data['position']).replace("{property}", self.property)
        internalThoughtPrompt = internalThoughtPrompt.replace("{currentMemory}", currentMemoryText).replace("{sender}", data['sender'])
        print("------------INTERNAL THOUGHT PROMPT------------")
        print(internalThoughtPrompt)
        internal_thought = self.generate(internalThoughtPrompt)

        # internalMemoryPrompt = self.prompt_paragraph["internal_thought_memory"]
        # internalMemoryPrompt = internalMemoryPrompt.replace("{query}", query).replace("{internal_thought}", internal_thought)
        print(internal_thought)
        # updateMemory(data[1], "diedie", QUERY, data[0])
        # self.updateMemory(internalMemoryPrompt, self.agent_name, memoryType.THOUGHT)
        # updateMemory(internal_prompt, "Jeff", THOUGHT, data[0])
        return internal_thought

    def action(self,query, data) -> str:
        jsonFile = "uuid\\" + self.agent_name +'.json'
        with open(jsonFile, 'r') as file:
            jsonData = json.load(file)
            find_money = "C:\\Users\\liyin\\Documents\\spigot (1)\\plugins\\Essentials\\userdata\\" + jsonData["uuid"]
            file.close
        with open(find_money, 'r') as file:
            dataYml = yaml.safe_load(file)
            self.property = dataYml['money']
            jsonData['property'] = dataYml['money']
            file.close
        with open(jsonFile, 'w') as file:
            json.dump(jsonData, file)
            file.close
        if self.timer.is_countdown_running():
            self.timer.signal_handler()
        else:
            self.timer.start_countdown()
        
        self.update_last_player = data['sender']
        query = str(query)
        query_embedding = self.get_ada_embedding(query)
        internal_thought = self.internalThought(query, query_embedding,data)        
        ACTION_results = self.getClosestVector(query_embedding, memoryType.ACTION,2)
        allText = ACTION_results['text'].values.tolist()

        result = ''
        for text in allText:
            result += text 
            result += '\n\n'

        externalThoughtPrompt = self.prompt_paragraph['external_thought']
        externalThoughtPrompt = externalThoughtPrompt.replace("{query}", query).replace("{internal_thought}", internal_thought).replace("{action}", result).replace("{time}", data['time']).replace("{wheather}", data['wheather']).replace("{location}",  data['position']).replace("{property}", self.property)
        externalThoughtPrompt = externalThoughtPrompt.replace("{sender}", data['sender']).replace("{current_schedule}",self.current_schedule)
        print("------------EXTERNAL THOUGHT PROMPT------------")
        print(externalThoughtPrompt)
        external_thought = self.generate(externalThoughtPrompt) 
        print(external_thought)

        array_match = re.search(r'\[.*\]', external_thought)
        if array_match:
            array_str = array_match.group()
            try:
                array = ast.literal_eval(array_str)
                print(array)
            except ValueError:
                print("error")
        else:
            print("no found")

        try:
            id,content = external_thought.split(':')
        except:
            content = external_thought
            id = 999
        print(array)
        self.putIntoJobQueue(array,state.chat)

        internalMemoryPrompt = self.prompt_paragraph["internal_thought_memory"]
        internalMemoryPrompt = internalMemoryPrompt.replace("{query}", query).replace("{internal_thought}", internal_thought).replace("{external_thought}", content).replace("{user}", data['sender']).replace("{agent}",'you')

        internalMemoryPrompt_daily = self.prompt_paragraph["internal_thought_memory"]
        internalMemoryPrompt_daily = internalMemoryPrompt_daily.replace("{query}", query).replace("{internal_thought}", internal_thought).replace("{external_thought}", content).replace("{user}", data['sender']).replace("{agent}",self.agent_name)
        
        
        self.updateMemory(internalMemoryPrompt,memoryType.THOUGHT)
        self.updateDailyMemory('('+data['time']+') : \n'+internalMemoryPrompt_daily,'chat')
        self.lastMessage = internalMemoryPrompt_daily
        externalMemoryPrompt = self.prompt_paragraph["external_thought_memory"]
        externalMemoryPrompt = externalMemoryPrompt.replace("{query}", query).replace("{external_thought}", external_thought)
        
        # self.updateMemory(externalMemoryPrompt, memoryType.ACTION)
        request_memory = self.prompt_paragraph["request_memory"]
        # self.updateMemory(request_memory.replace("{query}", query), memoryType.)
        
        return str(content)

    # def reload_sentence_file(self):
    #     self.sentence_embedding = pd.read_csv('fed-sentence.csv',index_col=False)
    #     self.sentence_embedding['embedding'] = self.sentence_embedding['text'].apply(lambda x: get_embedding(x, engine='text-embedding-ada-002'))
    #     self.sentence_embedding.to_csv('fed-sentence_embeddings.csv',index=False)
    #     self.sentence_embedding = pd.read_csv('fed-sentence_embeddings.csv',index_col = False)
    #     self.sentence_embedding['embedding'] = self.sentence_embedding['embedding'].apply(eval).apply(np.array)
    #     self.sentence_embedding.rename( columns={'Unnamed: 0':'taskID'}, inplace=True )

    def actionNameById(self,id):
        action = {
            0: "following user",
            1: "go home",
            2: "harvest the crops",
            3: "put things back",
            4: "collecting seeds and tools",
            5: "go to sleep",
            6: "eat something",
            7: "take crops back",
            8: "find food",
            9: "go to farm",
            10: "go to guild",
            11: "sell wheat",
            12: "making bread",
            13: "put sign",
            14: "drop item",
            15: "talk and stand",
            16: "discuss",
            17: "talk with people",
            18: "greeting with people",
            999: "null"
        }
        return action[int(id)]
    def get_agentState(self):
        return self.agent_state
    def init_prompt_paragraph(self):
        with open('prompts.yaml', 'r') as f:
            self.prompt_paragraph = yaml.load(f, Loader=yaml.FullLoader)
    def init_observe_prompt_paragraph(self):
        with open('observe.yaml', 'r') as f:
            self.observe_prompt_paragraph = yaml.load(f, Loader=yaml.FullLoader)
    def init_agent_info(self):
        jsonFile = open('agent_info.json','r')
        self.agent_info = json.load(jsonFile)
        print(self.agent_info)

    def init_agent_memory(self):   
        jsonFile = open(f".//memory//{self.agent_name}//memory.json",'r')
        self.agent_memory = json.load(jsonFile)
    def init_agent_dailyRecord(self):   
        jsonFile = open(f".//memory//{self.agent_name}//dailyRecord.json",'r')
        self.agent_dailyRecord = json.load(jsonFile)

    def init_day_count(self):
        with open('memory_count.yaml', 'r') as f:
            temp = yaml.load(f, Loader=yaml.FullLoader)
            self.day = temp['day']
    def init_SendingJobToMine(self):
        interval = 0.5 
        timer_thread = threading.Thread(target=self.SendingJobToMine, args=(interval,))
        timer_thread.start()
    def update_day_count(self):
        self.day = int(self.day) + 1
    def update_last_player(self,playerName):
        self.lastPlayer = playerName

    def save_day_count(self):
        with open('memory_count.yaml', 'w') as f:
            yaml.dump({'day': str(self.day)}, f)

    def save_Memory_file(self):
        action_Json = json.dumps(self.agent_memory, indent = 4)
        print(action_Json)
        with open( f".//memory//{self.agent_name}//memory.json","w") as jsonfile:
            jsonfile.write(action_Json)
            jsonfile.close()
    def save_DailyRecord_file(self):
        action_Json = json.dumps(self.agent_dailyRecord, indent = 4)
        print(action_Json)
        with open( f".//memory//{self.agent_name}//dailyRecord.json","w") as jsonfile:
            jsonfile.write(action_Json)
            jsonfile.close()
    def update_current_schedule(self,data):
        self.current_schedule = self.agent_dailyRecord[str(self.day)]['schedule'][data['time']]
        print(data['time'] + ' : '+self.current_schedule)
    def update_Job_state(self,data):
        self.JobStateFinish = True
        print(self.JobStateFinish)

    def update_Job_queue(self,job):
        self.agent_state = state.schedule
        self.JobQueue.put(job)
        print("Queue contents:", list(self.JobQueue.queue))
        




    def backup(self, data):
        jsonFile = "uuid\\" + self.agent_name +'.json'
        with open(jsonFile, 'r') as file:
            jsonData = json.load(file)
            find_money = "..\\spigot (1)\\plugins\\Essentials\\userdata\\" + jsonData["uuid"]
            file.close
        with open(find_money, 'r') as file:
            dataYml = yaml.safe_load(file)
            self.property = dataYml['money']
            jsonData['property'] = dataYml['money']
            file.close
        backup_planningPrompt = self.prompt_paragraph["backup_planning"]
        choosing_backupPrompt = self.prompt_paragraph["choosing_backup"]
        temp, task = data["message"].split(':')
        backup_planningPrompt = backup_planningPrompt.replace("{taskName}", task).replace("{taskItem}", data['item_name'])
        print("-----FIRST---STEP-----")
        print(backup_planningPrompt)
        condition = self.generate(backup_planningPrompt)
        print(condition)
        choosing_backupPrompt = choosing_backupPrompt.replace("{condition}", condition).replace("{time}", data['time']).replace("{wheather}", data['wheather']).replace("{location}", 'home').replace("{property}", str(self.property))
        print("-----SECOND---STEP-----")
        print(choosing_backupPrompt)
        response = self.generate(choosing_backupPrompt)
        print(response)
        return str(response)