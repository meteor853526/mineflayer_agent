from enum import Enum
class state():
    chat = 'chat'
    schedule = 'schedule'
    interrupt_action = 'interrupt'
    idle = 'idle'
class memoryType():
    INFORMATION = "information"
    QUERY = "query"
    THOUGHT = "internal_thought"
    ACTION = "external_thought"
class messageType():
    chat = "chat"
    system = "system"
    observe = "observe"
