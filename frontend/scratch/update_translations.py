import json
import os

languages = {
    "fr": {
        "title": "Votre Profil Privé",
        "desc": "Rejoignez notre communauté de créatrices d'élite. Vos informations personnelles restent strictement confidentielles.",
        "confirm": "Confirmer le mot de passe",
        "mismatch": "Les mots de passe ne correspondent pas.",
        "terms": "Vous devez accepter les conditions générales."
    },
    "es": {
        "title": "Tu Perfil Privado",
        "desc": "Únete a nuestra comunidad de creadores de élite. Tus datos personales se mantienen estrictamente confidenciales.",
        "confirm": "Confirmar Contraseña",
        "mismatch": "Las contraseñas no coinciden.",
        "terms": "Debes aceptar los términos y condiciones."
    },
    "de": {
        "title": "Dein privates Profil",
        "desc": "Tritt unserer Community der Elite-Creator bei. Deine persönlichen Daten werden streng vertraulich behandelt.",
        "confirm": "Passwort bestätigen",
        "mismatch": "Passwörter stimmen nicht überein.",
        "terms": "Du musst den Nutzungsbedingungen zustimmen."
    },
    "it": {
        "title": "Il tuo profilo privato",
        "desc": "Unisciti alla nostra comunità di creatori d'élite. I tuoi dati personali sono trattati in modo strettamente riservato.",
        "confirm": "Conferma Password",
        "mismatch": "Le password non corrispondono.",
        "terms": "Devi accettare i termini e le condizioni."
    },
    "nl": {
        "title": "Je privéprofiel",
        "desc": "Word lid van onze gemeenschap van elite-creators. Je persoonlijke gegevens worden strikt vertrouwelijk behandeld.",
        "confirm": "Wachtwoord bevestigen",
        "mismatch": "Wachtwoorden komen niet overeen.",
        "terms": "Je moet akkoord gaan met de voorwaarden."
    },
    "pt": {
        "title": "Seu Perfil Privado",
        "desc": "Junte-se à nossa comunidade de criadores de elite. Seus dados pessoais são mantidos estritamente confidenciais.",
        "confirm": "Confirmar Senha",
        "mismatch": "As senhas não coincidem.",
        "terms": "Você deve concordar com os termos e condições."
    },
    "ru": {
        "title": "Ваш личный профиль",
        "desc": "Присоединяйтесь к нашему сообществу элитных создателей. Ваши личные данные строго конфиденциальны.",
        "confirm": "Подтвердите пароль",
        "mismatch": "Пароли не совпадают.",
        "terms": "Вы должны согласиться с условиями и положениями."
    },
    "uk": {
        "title": "Ваш приватний профіль",
        "desc": "Приєднуйтесь до нашої спільноти елітних творців. Ваші особисті дані суворо конфіденційні.",
        "confirm": "Підтвердьте пароль",
        "mismatch": "Паролі не збігаються.",
        "terms": "Ви повинні погодитися з умовами."
    },
    "ro": {
        "title": "Profilul tău privat",
        "desc": "Alătură-te comunității noastre de creatori de elită. Datele tale personale sunt păstrate strict confidențiale.",
        "confirm": "Confirmă parola",
        "mismatch": "Parolele nu se potrivesc.",
        "terms": "Trebuie să fii de acord cu termenii și condițiile."
    },
    "sv": {
        "title": "Din privata profil",
        "desc": "Gå med i vår gemenskap av elitkreatörer. Dina personuppgifter hålls strikt konfidentiella.",
        "confirm": "Bekräfta lösenord",
        "mismatch": "Lösenorden matchar inte.",
        "terms": "Du måste godkänna villkoren."
    },
    "no": {
        "title": "Din private profil",
        "desc": "Bli med i vårt fellesskap av elite-skapere. Dine personopplysninger holdes strengt konfidentielle.",
        "confirm": "Bekreft passord",
        "mismatch": "Passordene samsvarer ikke.",
        "terms": "Du må godta vilkårene."
    },
    "fi": {
        "title": "Yksityinen profiilisi",
        "desc": "Liity eliittiluojien yhteisöömme. Henkilökohtaiset tietosi pidetään tiukan luottamuksellisina.",
        "confirm": "Vahvista salasana",
        "mismatch": "Salasanat eivät täsmää.",
        "terms": "Sinun on hyväksyttävä ehdot."
    }
}

base_path = "frontend/public/locales"

for lang, trans in languages.items():
    file_path = f"{base_path}/{lang}.json"
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        data["model.signup.step3_title"] = trans["title"]
        data["model.signup.step3_desc"] = trans["desc"]
        data["model.signup.step3_password_confirm"] = trans["confirm"]
        data["model.signup.error.password_mismatch"] = trans["mismatch"]
        data["model.signup.error.terms_required"] = trans["terms"]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Updated {lang}.json")
    else:
        print(f"Skipped {lang}.json (not found)")
