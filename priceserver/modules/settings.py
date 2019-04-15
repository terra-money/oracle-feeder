import json

settings = {}

try:
    settings = json.loads(open('setting.json', 'r').read())
except:
    raise Exception("setting.json not found")

