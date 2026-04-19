import os
import json

locales_dir = "/Users/fabrice/APPS/LC Bis/lively/frontend/public/locales"
files = [f for f in os.listdir(locales_dir) if f.endswith('.json')]

new_keys = {
    "en.json": {
        "title": "Friendship takes time!",
        "desc": "You must spend at least 3 minutes in a call with this model before you can add her to your favorites.",
        "cta": "Got it"
    },
    "fr.json": {
        "title": "Ami à gagner !",
        "desc": "Vous devez passer au moins 3 minutes en appel avec ce modèle avant de pouvoir l'ajouter à vos favoris.",
        "cta": "Compris"
    },
    "es.json": {
        "title": "¡Amistad en camino!",
        "desc": "Debes pasar al menos 3 minutos en una llamada con esta modelo antes de poder añadirla a tus favoritos.",
        "cta": "Entendido"
    },
    "de.json": {
        "title": "Freundschaft braucht Zeit!",
        "desc": "Du musst mindestens 3 Minuten mit diesem Modell telefonieren, bevor du es zu deinen Favoriten hinzufügen kannst.",
        "cta": "Verstanden"
    },
    "it.json": {
        "title": "L'amicizia richiede tempo!",
        "desc": "Devi trascorrere almeno 3 minuti in chiamata con questa modella prima di poterla aggiungere ai tuoi preferiti.",
        "cta": "Ho capito"
    },
    "pt.json": {
        "title": "Amizade leva tempo!",
        "desc": "Você deve passar pelo menos 3 minutos em uma chamada com esta modelo antes de poder adicioná-la aos seus favoritos.",
        "cta": "Entendi"
    },
    "nl.json": {
        "title": "Vriendschap kost tijd!",
        "desc": "Je moet minstens 3 minuten in een gesprek met dit model doorbrengen voordat je haar aan je favorieten kunt toevoegen.",
        "cta": "Begrepen"
    },
    "fi.json": {
        "title": "Ystävyys vie aikaa!",
        "desc": "Sinun on vietettävä vähintään 3 minuuttia puhelussa tämän mallin kanssa, ennen kuin voit lisätä hänet suosikkeihisi.",
        "cta": "Selvä"
    },
    "no.json": {
        "title": "Vennskap tar tid!",
        "desc": "Du må tilbringe minst 3 minutter i en samtale med denne modellen før du kan legge henne till i favorittene dine.",
        "cta": "Skjønner"
    },
    "sv.json": {
        "title": "Vänskap tar tid!",
        "desc": "Du måste spendera minst 3 minuter i ett samtal med den här modellen innan du kan lägga till henne i dina favoriter.",
        "cta": "Uppfattat"
    },
    "ru.json": {
        "title": "Дружба требует времени!",
        "desc": "Вы должны провести не менее 3 минут в звонке с этой моделью, прежде чем сможете добавить ее в избранное.",
        "cta": "Понятно"
    },
    "uk.json": {
        "title": "Дружба потребує часу!",
        "desc": "Ви повинні провести принаймні 3 хвилини у дзвінку з цією моделлю, перш ніж зможете додати її до обраного.",
        "cta": "Зрозуміло"
    },
    "ro.json": {
        "title": "Prietenia necesită timp!",
        "desc": "Trebuie să petreci cel puțin 3 minute într-un apel cu acest model înainte de a-l putea adăuga la favorite.",
        "cta": "Am înțeles"
    }
}

for filename in files:
    path = os.path.join(locales_dir, filename)
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Identify the corrupted part
    # It started when I replaced "}" with something else.
    # The last correct line was "later": "..." (line 820 in en.json)
    
    clean_lines = []
    found_corruption = False
    for line in lines:
        if 'favorite.restriction.title' in line and ',' in line[:10]: # Look for the comma started line
            found_corruption = True
            break
        clean_lines.append(line)
    
    # Rebuild the content
    content = "".join(clean_lines)
    
    # Fix the closing braces for incoming and direct_call
    # Since I replaced "}" with ", favorite..." 3 times, I need to add back 3 closing braces effectively.
    # Actually, let's just make sure we close the objects.
    # Better: just parse what we have if possible, but it's invalid JSON.
    
    # Search for the last open brace level.
    # Based on research:
    # 815:     "incoming": {
    # 820:       "later": "LATER"
    
    # If the last line is "later": "...", we need to close incoming, then direct_call, then the root.
    if "later" in clean_lines[-1] or found_corruption:
        # Strip trailing commas and whitespace from the last line to be safe
        clean_lines[-1] = clean_lines[-1].rstrip().rstrip(',') + '\n'
        content = "".join(clean_lines)
        content += "    }\n  },\n"
        
        # Add the new keys
        keys = new_keys.get(filename, new_keys["en.json"])
        content += f'  "favorite.restriction.title": "{keys["title"]}",\n'
        content += f'  "favorite.restriction.desc": "{keys["desc"]}",\n'
        content += f'  "favorite.restriction.cta": "{keys["cta"]}"\n'
        content += "}"
    
    # Validate and format
    try:
        data = json.loads(content)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Fixed {filename}")
    except Exception as e:
        print(f"Failed to fix {filename}: {e}")
        # If it failed, let's try a simpler approach for this file
        print(f"DEBUG: Content tail:\n{content[-100:]}")
