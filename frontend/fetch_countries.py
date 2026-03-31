import json
import urllib.request
import ssl
import os

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request('https://restcountries.com/v3.1/all')
req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
req.add_header('Accept', 'application/json')

with urllib.request.urlopen(req, context=ctx) as response:
    data = json.loads(response.read().decode())

formatted = []
for c in data:
    if not isinstance(c, dict): continue
    if 'idd' not in c or not isinstance(c['idd'], dict) or 'root' not in c['idd']: continue
    
    code = c.get('cca2', '')
    nameFr = c.get('translations', {}).get('fra', {}).get('common', '')
    if not nameFr:
        nameFr = c.get('name', {}).get('common', 'Unknown')
        
    nameEn = c.get('translations', {}).get('eng', {}).get('common', '')
    if not nameEn:
        nameEn = c.get('name', {}).get('common', nameFr)
        
    if nameFr == 'Unknown': continue
    
    root = c['idd']['root']
    suffixes = c['idd'].get('suffixes', [])
    dialCode = root + (suffixes[0] if len(suffixes) == 1 else '')
    
    flag = c.get('flag', '')
    
    # Clean dial codes that look like '+1242' etc while keeping the first suffix if applicable
    
    formatted.append({
        'code': code,
        'nameFr': nameFr,
        'nameEn': nameEn,
        'dialCode': dialCode,
        'flag': flag
    })

formatted.sort(key=lambda x: x['nameFr'])

content = """export type CountryData = {
    code: string;
    nameFr: string;
    nameEn: string;
    dialCode: string;
    flag: string;
};

export const countries: CountryData[] = """ + json.dumps(formatted, ensure_ascii=False, indent=4) + ";\n"

out_path = 'src/utils/countries.ts'
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Successfully wrote {len(formatted)} countries to {out_path}")
