import json
import os
import requests

env_path = '/Users/fabrice/APPS/LC Bis/lively/backend/.env'
GOOGLE_API_KEY = None
with open(env_path, 'r') as f:
    for line in f:
        if line.startswith('GOOGLE_API_KEY='):
            GOOGLE_API_KEY = line.strip().split('=', 1)[1]
            break

english_text = """Last Updated: April 28, 2026

1. ACCEPTANCE OF TERMS AND BINDING AGREEMENT
Welcome to Kinky.live. These Terms of Service (the "Terms", "TOS", or "Agreement") constitute a legally binding contract between you ("User", "you", "your") and MV CAPITAL, a Simplified Joint-Stock Company (SAS) registered under the laws of France, with its registered office located at 50 avenue des Champs Elysées, 75008 Paris, France ("Company", "we", "us", or "our").

By accessing, browsing, registering an account, purchasing virtual credits, or otherwise using the website https://www.kinky.live and its associated subdomains, mobile versions, or applications (collectively, the "Platform" or "Site"), you acknowledge that you have read, understood, and agree to be bound by these Terms in their entirety.

IF YOU DO NOT AGREE TO ALL OF THE TERMS AND CONDITIONS OUTLINED HEREIN, YOU ARE EXPRESSLY PROHIBITED FROM USING THE PLATFORM AND MUST DISCONTINUE USE IMMEDIATELY.

We reserve the right, in our sole and absolute discretion, to modify, alter, or update these Terms at any time. Any changes will be effective immediately upon posting the revised Terms on the Site, and the "Last Updated" date will reflect the date of the most recent modifications. Your continued use of the Platform following the posting of changes constitutes your acceptance of such changes.

2. DEFINITIONS
"Broadcaster" or "Creator" or "Model": An independent third-party contractor who utilizes the Platform to broadcast live video feeds and interact with Users.

"Content": Any material, including but not limited to video, audio, text, graphics, messages, or software, transmitted, uploaded, or displayed on the Platform by Users or Broadcasters.

"Virtual Credits": The digital token system utilized on the Platform, purchased with fiat currency, enabling Users to access premium features such as private video chat sessions.

"Private Session": A 1-on-1 real-time video and audio communication between a User and a Broadcaster.

3. ELIGIBILITY, AGE VERIFICATION, AND COMPLIANCE
3.1 Age Restriction: Access to and use of this Platform is strictly limited to individuals who are at least EIGHTEEN (18) YEARS OF AGE, or the age of legal majority in the jurisdiction from which you are accessing the Site, whichever is greater. By entering the Site, you represent and warrant under penalty of perjury that you meet this age requirement.
3.2 Geolocation and Jurisdiction: The Platform is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation. It is your sole responsibility to ensure that your use of the Platform complies with all local, state, and national laws applicable to you.
3.3 18 U.S.C. § 2257 Compliance: MV CAPITAL strictly adheres to the record-keeping requirements of 18 U.S.C. § 2257 and subsequent regulations. All Broadcasters appearing on the Platform are required to undergo stringent identity and age verification prior to broadcasting.

4. ACCOUNT REGISTRATION AND SECURITY
4.1 Account Creation: Certain features of the Site require you to register an account. You agree to provide true, accurate, current, and complete information during the registration process.
4.2 Account Responsibility: You are entirely responsible for maintaining the strict confidentiality of your account login credentials (username and password). You agree to accept full responsibility for all activities, charges, and damages that occur under your account, whether authorized by you or not.
4.3 Unauthorized Access: You must notify us immediately of any suspected unauthorized use of your account. The Company will not be liable for any losses or damages arising from your failure to comply with these security obligations.
4.4 Single Account: You are permitted to maintain only one active User account. The creation of multiple accounts to exploit promotions, evade bans, or manipulate the Platform is strictly prohibited.

5. VIRTUAL CREDITS, BILLING, AND REFUND POLICY
5.1 Nature of Virtual Credits: The Platform operates utilizing a proprietary Virtual Credit system. Virtual Credits are a limited, non-exclusive, non-transferable, revocable license to access specific digital features on the Platform. Virtual Credits are not real money, hold no inherent real-world monetary value, do not accrue interest, and cannot be redeemed, sold, or exchanged for fiat currency by Users under any circumstances.
5.2 Purchasing: You may purchase Virtual Credits using the payment methods made available on the Site. By initiating a transaction, you warrant that you are the authorized user of the credit card, bank account, or payment method utilized. All prices are stated on the Site and may be subject to applicable taxes, including VAT, based on your geographical location.
5.3 Consumption: Virtual Credits are consumed in real-time when you engage in a Private Session with a Broadcaster (typically at a rate of 10 credits per minute). Credits are deducted continuously for the duration of the connection.
5.4 STRICT NO-REFUND POLICY: Due to the immediate delivery and consumable nature of digital live-streaming services, ALL SALES OF VIRTUAL CREDITS ARE FINAL AND NON-REFUNDABLE. By purchasing Virtual Credits, you expressly acknowledge and agree that you waive any applicable statutory right of withdrawal or "cooling-off" period.
5.5 Inactivity: Any Virtual Credits remaining in an account that has been inactive (no logins) for a continuous period of twelve (12) months may be considered abandoned and forfeited to the Company without notice or compensation.

6. CHARGEBACK AND FRAUD POLICY
6.1 Zero Tolerance: We employ a strict zero-tolerance policy against credit card fraud and chargeback abuse ("friendly fraud").
6.2 Consequences of a Chargeback: If you initiate a chargeback, dispute, or reversal of a payment made on Kinky.live with your bank or credit card issuer:

Your account will be suspended immediately and permanently.

Your IP address, device ID, and associated details will be permanently banned from the Platform and may be shared with third-party fraud prevention databases used within the industry.

Any remaining Virtual Credits in your account will be immediately voided.
6.3 Legal Recourse: MV CAPITAL reserves the right to vigorously contest any chargeback. We will provide your bank with your IP logs, account history, session logs, and proof of service consumption. Furthermore, we reserve the right to pursue civil and criminal legal action to recover the disputed amount, administrative fees, and legal costs incurred.

7. USER CONDUCT AND STRICTLY PROHIBITED ACTIVITIES
You agree to use the Platform in a manner consistent with any and all applicable laws and regulations. You are strictly prohibited from engaging in, attempting to engage in, or assisting others in any of the following activities:
7.1 Illegal and Harmful Acts:

Broadcasting, requesting, or promoting content involving minors (or individuals who appear to be minors).

Engaging in or promoting non-consensual acts, violence, self-harm, bestiality, or necrophilia.

Using the Platform for money laundering, human trafficking, or prostitution.

Transmitting any content that is defamatory, threatening, harassing, abusive, or hateful toward any individual or group.
7.2 Platform Manipulation and Technical Abuse:

Using automated scripts, bots, spiders, or scrapers to access the Site, interact with Broadcasters, or harvest data.

Attempting to interfere with, disrupt, or bypass any security measures, access controls, or digital rights management tools on the Platform.

Uploading or transmitting viruses, malware, trojan horses, or any malicious code.
7.3 Privacy and Intellectual Property Violations:

Recording: Capturing, downloading, screen-recording, or otherwise reproducing any video or audio stream from the Platform under any circumstances.

Off-Platform Solicitation: Attempting to extract personal information from Broadcasters, sharing your own contact details (email, phone numbers, social media handles), or attempting to solicit transactions outside of the Kinky.live billing system.

8. INDEPENDENT CONTRACTOR STATUS OF BROADCASTERS
You explicitly acknowledge and agree that all Broadcasters appearing on the Platform are independent third-party contractors. They are not employees, agents, representatives, or partners of MV CAPITAL.

The Company does not direct, control, or script the performances or speech of the Broadcasters.

The Company assumes no responsibility or liability whatsoever for the actions, statements, promises, or behavior of any Broadcaster during a Private Session.

Any disputes arising directly between a User and a Broadcaster remain strictly between those two parties.

9. INTELLECTUAL PROPERTY AND LICENSES
9.1 Company IP: All rights, title, and interest in and to the Platform (including the underlying source code, algorithms, interface design, text, and graphics) are the exclusive property of MV CAPITAL and are protected by international copyright, trademark, and trade secret laws.
9.2 Limited License: Subject to your strict compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Platform for your personal, non-commercial entertainment purposes only.
9.3 DMCA & Copyright Policy: If you believe that any Content on the Platform infringes upon your copyright, you may submit a notification pursuant to the Digital Millennium Copyright Act (DMCA) or applicable European directives by providing our legal team with a written notice containing all required statutory elements.

10. DISCLAIMER OF WARRANTIES
THE PLATFORM, THE CONTENT, AND ALL SERVICES ARE PROVIDED ON AN "AS-IS", "WHERE-IS", AND "AS-AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE PURSUANT TO APPLICABLE LAW, MV CAPITAL DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND SYSTEM INTEGRATION. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM VIRUSES OR OTHER HARMFUL COMPONENTS.

11. LIMITATION OF LIABILITY
IN NO EVENT SHALL MV CAPITAL, ITS DIRECTORS, OFFICERS, EMPLOYEES, AFFILIATES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE PLATFORM, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US FOR SERVICES DURING THE THREE (3) MONTH PERIOD PRIOR TO THE EVENT GIVING RISE TO THE CLAIM.

12. INDEMNIFICATION
You agree to rigorously defend, indemnify, and hold harmless MV CAPITAL, its subsidiaries, affiliates, and all of their respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys' fees and expenses, made by any third party due to or arising out of:
(1) your use of the Platform;
(2) your breach of these Terms;
(3) any breach of your representations and warranties set forth in these Terms;
(4) your violation of the rights of a third party, including but not limited to intellectual property rights or privacy rights.

13. GOVERNING LAW AND DISPUTE RESOLUTION
13.1 Governing Law: These Terms and your access to and use of the Platform shall be governed by and construed and enforced in accordance with the laws of France, without regard to conflict of law rules or principles.
13.2 Jurisdiction: Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or invalidity thereof, shall be submitted to the exclusive jurisdiction of the competent commercial courts located in Paris, France. You hereby irrevocably consent to the personal jurisdiction of such courts and waive any defense of forum non conveniens.

14. MISCELLANEOUS
14.1 Severability: If any provision of these Terms is found to be unlawful, void, or unenforceable, that provision is deemed severable from these Terms and does not affect the validity and enforceability of any remaining provisions.
14.2 Entire Agreement: These Terms constitute the entire agreement and understanding between you and MV CAPITAL concerning the subject matter herein and supersede all prior or contemporaneous communications and proposals, whether electronic, oral, or written.
14.3 No Waiver: The failure of the Company to exercise or enforce any right or provision of these Terms shall not operate as a waiver of such right or provision.

15. CONTACT INFORMATION
For any legal notices, questions about these Terms, or compliance issues, please contact us at:
MV CAPITAL
50 avenue des Champs Elysées
75008 Paris, France
Email: legal@kinky.live"""

locales = ['de', 'en', 'es', 'fi', 'fr', 'it', 'nl', 'no', 'pt', 'ro', 'ru', 'sv', 'uk']
base_dir = '/Users/fabrice/APPS/LC Bis/lively/frontend/public/locales'

def translate_text(text, target_lang):
    if target_lang == 'en': return text
    print(f"Translating to {target_lang}...")
    url = f"https://translation.googleapis.com/language/translate/v2?key={GOOGLE_API_KEY}"
    payload = {
        "q": text,
        "target": target_lang
    }
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        data = response.json()
        translated = data['data']['translations'][0]['translatedText']
        
        # very basic html decode for quotes and apostrophes from google translate
        translated = translated.replace("&quot;", '"').replace("&apos;", "'").replace("&#39;", "'")
        return translated
    else:
        print(f"Error translating to {target_lang}:", response.text)
        return text

for locale in locales:
    file_path = os.path.join(base_dir, f"{locale}.json")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        translated_text = translate_text(english_text, locale)
        data['terms.full_text'] = translated_text
        
        # also update title and updated
        data['terms.title'] = translate_text("Terms of Service", locale) if locale != 'en' else "Terms of Service"
        data['terms.updated'] = translate_text("Last Updated: April 28, 2026", locale) if locale != 'en' else "Last Updated: April 28, 2026"
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Updated {locale}.json")
    else:
        print(f"File not found: {file_path}")
