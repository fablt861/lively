import json
import os

locales_dir = "/Users/fabrice/APPS/LC Bis/lively/frontend/public/locales"
translations = {
    "fr": ("Mes Partenaires Favoris", "Vous n'avez pas encore de favoris. Commencez à matcher pour les trouver !"),
    "es": ("Mis Compañeros Favoritos", "Aún no has añadido favoritos. ¡Empieza a emparejar para encontrarlos!"),
    "de": ("Meine Lieblingspartner", "Du hast noch keine Favoriten hinzugefügt. Fang an zu matchen, um sie zu finden!"),
    "it": ("I Miei Partner Preferiti", "Non hai ancora aggiunto preferiti. Inizia a fare match per trovarli!"),
    "pt": ("Meus Parceiros Favoritos", "Você ainda no adicionou favoritos. Comece a combinar para encontrá-los!"),
    "ru": ("Мои любимые партнеры", "Вы еще не добавили ни одного фаворита. Начните знакомства, чтобы найти их!"),
    "uk": ("Мої улюблені партнери", "Ви ще не додали жодного фаворита. Почніть знайомства, щоб знайти їх!"),
    "nl": ("Mijn favoriete partners", "Je hebt nog geen favorieten toegevoegd. Begin met matchen om ze te vinden!"),
    "fi": ("Suosikkikumppanini", "Et ole vielä lisännyt suosikkeja. Aloita yhdistäminen löytääksesi heidät!"),
    "no": ("Mine favorittpartnere", "Du har ikke lagt til noen favoritter ennå. Begynn å matche for å finne dem!"),
    "sv": ("Mina favoritpartners", "Du har inte lagt till några favoriter än. Börja matcha för att hitta dem!"),
    "ro": ("Partenerii mei favoriți", "Nu ai adăugat încă niciun favorit. Începe să te potrivești pentru a-i găsi!")
}

for lang, (title, empty) in translations.items():
    file_path = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Add new keys
        data["dashboard.favorites_title"] = title
        data["dashboard.favorites_empty"] = empty
        
        # Save back sorted to maintain some order (or just save)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated {lang}.json")
