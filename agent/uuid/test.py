import json
import yaml

last_player = "worker"
last_player+=".json"
with open(last_player,"r+") as file:
    jsonData = json.load(file)
    # print(jsonData["uuid"])
    find_money = "C:\\Users\\liyin\\Documents\\spigot (1)\\plugins\\Essentials\\userdata\\" + jsonData["uuid"]
    file.close
with open(find_money, "r") as f:
    data = yaml.safe_load(f)
    print(data["money"])
    jsonData["money"] = data["money"]
    f.close
with open(last_player,"w") as file:
    json.dump(jsonData, file)
    file.close