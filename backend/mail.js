const axios = require('axios');
require('dotenv').config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_CONTACT_URL = 'https://api.brevo.com/v3/contacts';

const TRANSLATIONS = {
    fr: {
        subject: 'Félicitations ! Votre compte Kinky Elite est validé 🚀',
        welcome: 'Bienvenue chez Kinky, {{name}} !',
        message: 'Bonne nouvelle : un administrateur vient de valider votre profil. Vous pouvez désormais vous connecter et commencer à générer des revenus.',
        loginBtn: 'Se connecter à mon compte',
        closing: "À très vite sur Kinky !<br>L'équipe Elite"
    },
    en: {
        subject: 'Congratulations! Your Kinky Elite account is validated 🚀',
        welcome: 'Welcome to Kinky, {{name}}!',
        message: 'Great news: an administrator has just validated your profile. You can now log in and start generating income.',
        loginBtn: 'Log in to my account',
        closing: "See you soon on Kinky!<br>The Elite Team"
    },
    de: {
        subject: 'Herzlichen Glückwunsch! Ihr Kinky Elite Konto ist bestätigt 🚀',
        welcome: 'Willkommen bei Kinky, {{name}}!',
        message: 'Gute Neuigkeiten: Ein Administrator hat Ihr Profil soeben bestätigt. Sie können sich jetzt einloggen und anfangen, Einnahmen zu erzielen.',
        loginBtn: 'In mein Konto einloggen',
        closing: "Bis bald auf Kinky!<br>Das Elite-Team"
    },
    es: {
        subject: '¡Felicidades! Tu cuenta de Kinky Elite ha sido validada 🚀',
        welcome: '¡Bienvenida a Kinky, {{name}}!',
        message: 'Buenas noticias: un administrador acaba de validar tu perfil. Ya puedes iniciar sesión y empezar a generar ingresos.',
        loginBtn: 'Entrar en mi cuenta',
        closing: "¡Nos vemos pronto en Kinky!<br>El Equipo Elite"
    },
    it: {
        subject: 'Congratulazioni! Il tuo account Kinky Elite è stato convalidato 🚀',
        welcome: 'Benvenuta su Kinky, {{name}}!',
        message: 'Ottime notizie: un amministratore ha appena convalidato il tuo profilo. Ora puoi accedere e iniziare a generare guadagni.',
        loginBtn: 'Accedi al mio account',
        closing: "A presto su Kinky!<br>Il Team Elite"
    },
    nl: {
        subject: 'Gefeliciteerd! Je Kinky Elite-account is gevalideerd 🚀',
        welcome: 'Welkom bij Kinky, {{name}}!',
        message: 'Goed nieuws: een beheerder heeft zojuist je profiel gevalideerd. Je kunt nu inloggen en beginnen met het genereren van inkomsten.',
        loginBtn: 'Inloggen op mijn account',
        closing: "Tot snel op Kinky!<br>Het Elite Team"
    },
    pt: {
        subject: 'Parabéns! Sua conta Kinky Elite foi validada 🚀',
        welcome: 'Bem-vinda à Kinky, {{name}}!',
        message: 'Boas notícias: um administrador acabou de validar seu perfil. Agora você pode entrar e começar a gerar renda.',
        loginBtn: 'Entrar na minha conta',
        closing: "Até breve na Kinky!<br>A Equipa Elite"
    },
    ro: {
        subject: 'Felicitări! Contul tău Kinky Elite a fost validat 🚀',
        welcome: 'Bun venit la Kinky, {{name}}!',
        message: 'Vești bune: un administrator tocmai ți-a validat profilul. Acum te poți autentifica și poți începe să generezi venituri.',
        loginBtn: 'Autentificare în contul meu',
        closing: "Pe curând pe Kinky!<br>Echipa Elite"
    },
    uk: {
        subject: 'Вітаємо! Ваш акаунт Kinky Elite підтверджено 🚀',
        welcome: 'Ласкаво просимо до Kinky, {{name}}!',
        message: 'Чудові новини: адміністратор щойно підтвердив ваш профіль. Тепер ви можете увійти та почати заробляти.',
        loginBtn: 'Увійти в мій каунт',
        closing: "До зустрічі на Kinky!<br>Команда Elite"
    },
    ru: {
        subject: 'Поздравляем! Ваш аккаунт Kinky Elite подтвержден 🚀',
        welcome: 'Добро пожаловать в Kinky, {{name}}!',
        message: 'Отличные новости: администратор только что подтвердил ваш профиль. Теперь вы можете войти и начать зарабатывать.',
        loginBtn: 'Войти в мой аккаунт',
        closing: "До встречи на Kinky!<br>Команда Elite"
    },
    sv: {
        subject: 'Grattis! Ditt Kinky Elite-konto har validerats 🚀',
        welcome: 'Välkommen till Kinky, {{name}}!',
        message: 'Goda nyheter: en administratör har precis validerat din profil. Du kan nu logga in och börja tjäna pengar.',
        loginBtn: 'Logga in på mitt konto',
        closing: "Vi ses snart på Kinky!<br>Elite-teamet"
    },
    no: {
        subject: 'Gratulerer! Din Kinky Elite-konto er validert 🚀',
        welcome: 'Velkommen til Kinky, {{name}}!',
        message: 'Gode nyheter: en administrator har nettopp validert profilen din. Din konto er nå aktiv.',
        loginBtn: 'Logg inn på min konto',
        closing: "Vi ses snart på Kinky!<br>Elite-teamet"
    },
    fi: {
        subject: 'Onnittelut! Kinky Elite -tilisi on vahvistettu 🚀',
        welcome: 'Tervetuloa Kinkyyn, {{name}}!',
        message: 'Hyviä uutisia: ylläpitäjä on juuri vahvistanut profiilisi. Voit nyt kirjautua sisään.',
        loginBtn: 'Kirjaudu tililleni',
        closing: "Nähdään pian Kinkyssä!<br>Elite-tiimi"
    }
};

/**
 * Sends a welcome email to a newly validated model and adds them to the contact list.
 * @param {string} email - Model's email address
 * @param {string} name - Model's name/pseudo
 * @param {string} lang - Model's language preference
 * @param {object} additionalAttributes - Extra CRM fields (PSEUDO, SMS, COUNTRY, etc.)
 */
async function sendWelcomeEmail(email, name, lang = 'en', additionalAttributes = {}) {
    if (!BREVO_API_KEY) {
        console.warn('[MAIL] Brevo API Key missing. Skipping email.');
        return;
    }

    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    const subject = t.subject;
    const header = t.welcome.replace('{{name}}', name);

    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'hello@kinky.live';
    const senderName = process.env.BREVO_SENDER_NAME || 'Kinky Elite';

    try {
        // 1. Send Transactional Email
        const emailData = {
            sender: { name: senderName, email: senderEmail },
            to: [{ email: email, name: name }],
            subject: subject,
            htmlContent: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #6366f1;">${header}</h2>
                    <p>${t.message}</p>
                    
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="https://www.kinky.live/login" style="background: #6366f1; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 10px 20px rgba(99,102,241,0.2);">${t.loginBtn}</a>
                    </div>

                    <p style="margin-top: 30px;">${t.closing}</p>
                </div>
            `
        };

        const emailRes = await axios.post(BREVO_API_URL, emailData, {
            headers: {
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`[MAIL] welcome email sent in [${lang}] to ${email} (MessageID: ${emailRes.data.messageId})`);

        // 2. Add to Contact List
        try {
            await axios.post(BREVO_CONTACT_URL, {
                email: email,
                attributes: { 
                    FNAME: name,
                    ...additionalAttributes 
                },
                listIds: [2],
                updateEnabled: true
            }, {
                headers: {
                    'api-key': BREVO_API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`[MAIL] ${email} added/updated in Brevo contact list with attributes.`);
        } catch (listErr) {
            console.error('[MAIL] Error adding to contact list (check attribute existence in Brevo):', listErr.response?.data || listErr.message);
        }

    } catch (err) {
        console.error('[MAIL] Error sending email via Brevo:', err.response?.data || err.message);
    }
}

module.exports = { sendWelcomeEmail };
