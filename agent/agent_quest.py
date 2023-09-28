

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

openai.api_key = "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"
sio = socketio.Client()
sio.connect('http://localhost:3000')

agent_list = ['diedie','Jeff']
class agent_quest:
    
    def __init__(self,name):
            self.agent_name = name
            self.init_quest()
            self.init_prompt_paragraph()
            self.init_agent_info()
            self.temp_record = []
    
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
    def request(self,data) -> str:
        request = self.prompt_paragraph["request"]
        temp = data['message']
        alltext = ''
        count = 0
        for text in self.temp_record[-4:]:
            alltext += '('+str(count)+') . '+ text + ',\n'
            count += 1
        if alltext == '':alltext = 'null'
        
        request_list = ''
        for agent, info in self.request_state.items():
         
            for category, details in info.items():
        
                for item, value in details.items():
            
                    if value == True:
                        id = self.request_state[agent]['id'][item]
                        request_list += '('+str(id)+'). ' + self.description[str(id)] + ',\n'
        if request_list == '':request_list = 'null'
        
        

    

        request = request.replace("{player}", data['sender']).replace("{chat}", data['message']).replace("{chat_record}", alltext).replace("{request}", request_list)
        print(request)
        respond = self.generate(request)
        output_list = eval(respond)
        data['message'] = output_list[0]
        try:
            if isinstance(output_list[1], int):
                print("://", output_list[1])
                data['request_id'] = output_list[1]
        except:
            pass
        print(respond)
        
        self.update_record(data['sender'] + " say '" +temp + '\'to you,then you reply:'+  output_list[0])

        return data

    def update_record(self,chat):
        self.temp_record.append(chat)
        print(self.temp_record)
        
    def check_requestState(self,agent,item,item_id):
        data = {}
        data['state'] = self.request_state[agent]['state'][item]
        data['request_id'] = self.request_state[agent]['id'][item]
        data['item_id'] = item_id
        return data
    
    def disable_requestState(self,agent,item):
        self.request_state[agent]['state'][item] = False

    def enable_requestState(self,agent,item):
        self.request_state[agent]['state'][item] = True

    def save__requestState(self):
        request_state = json.dumps(self.request_state, indent = 4)
        print(request_state)
        with open( f"..//RequestPool.json","w") as jsonfile:
            jsonfile.write(request_state)
            jsonfile.close()
    def init_quest(self):
        jsonFile = open(f".//RequestPool.json",'r')
        self.request_state = json.load(jsonFile)
        jsonFile = open(f".//request_description.json",'r')
        self.description = json.load(jsonFile)
    def init_prompt_paragraph(self):
        with open('prompts_request.yaml', 'r') as f:
            self.prompt_paragraph = yaml.load(f, Loader=yaml.FullLoader)
    def init_agent_info(self):
        jsonFile = open('agent_info.json','r')
        self.agent_info = json.load(jsonFile)
        print(self.agent_info)