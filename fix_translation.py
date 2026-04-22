import json
import glob

locales_dir = 'frontend/public/locales/'
files = glob.glob(locales_dir + '*.json')

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Remove nested keys and store them flat
    to_add = {}
    if 'profile' in data and isinstance(data['profile'], dict):
        for k, v in data['profile'].items():
            to_add[f"profile.{k}"] = v
        del data['profile']
        
    if 'auth' in data and isinstance(data['auth'], dict):
        for k, v in data['auth'].items():
            to_add[f"auth.{k}"] = v
        del data['auth']
        
    data.update(to_add)
    
    with open(file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Fixed {file}")

