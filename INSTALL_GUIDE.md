# SPARKY v4.0 — Android App Installation Guide
## Bhai ke liye step-by-step guide!

---

## STEP 1 — Pehle ye install karo PC pe

1. **Node.js** download karo: https://nodejs.org (LTS version lo)
2. **VS Code** download karo: https://code.visualstudio.com
3. Dono install kar lo normally

---

## STEP 2 — Expo Go app apne Android phone pe install karo

- Play Store kholo
- "Expo Go" search karo
- Install kar lo
- (Isse testing hogi bina APK banaye)

---

## STEP 3 — SPARKY project setup karo

PC pe Command Prompt / Terminal kholo aur ye commands ek ek karke likho:

```bash
# Expo CLI install karo globally
npm install -g expo-cli eas-cli

# SPARKY folder mein jao (jahan tune files save ki hain)
cd sparky-app

# Sare packages install karo
npm install

# Expo account banao (free hai)
expo register
# ya agar pehle se hai to:
expo login
```

---

## STEP 4 — Apni Claude API Key lagao

1. https://console.anthropic.com pe jao
2. Account banao (free mein $5 credit milta hai)
3. API Keys section mein jao → New Key banao
4. `App.js` file kholo VS Code mein
5. Line 8 pe: `YOUR_API_KEY_HERE` ki jagah apni key lagao
   ```js
   const ANTHROPIC_API_KEY = 'sk-ant-xxxxxxxxxxxxxxxx';
   ```

---

## STEP 5 — Phone pe test karo (AASAAN TARIKA)

```bash
# SPARKY start karo
npx expo start
```

- Terminal mein ek QR code aayega
- Apne phone pe Expo Go app kholo
- QR code scan karo
- **SPARKY aapke phone pe chal jaayega!**

---

## STEP 6 — Real APK banao (Phone pe permanently install karne ke liye)

```bash
# EAS build setup
eas build:configure

# Android APK banao (free mein!)
eas build --platform android --profile preview
```

- Ye 10-15 minute lagega
- Build complete hone pe link milega
- Link se APK download karo
- Phone pe install karo (Unknown sources allow karna padega settings mein)

---

## SPARKY Features in App:
- Real Claude AI conversations (Hinglish mein!)
- Voice input (Hindi mein bolo)
- AI voice output (SPARKY bolega bhi!)
- Holographic JARVIS-style UI
- Rotating ring animations
- Voice wave visualizer
- Battery, CPU, RAM monitoring
- Quick command buttons
- Memory counter
- Real-time clock

---

## Problems? Ye try karo:

**"npm not found"** → Node.js dobara install karo

**"expo not found"** → `npm install -g expo-cli` dobara run karo

**Voice kaam nahi kar rahi** → Phone settings → Apps → SPARKY → Permissions → Microphone ON karo

**API error** → API key check karo App.js mein

---

## Bhai yaad rakh:
- Expo Go app se seedha test kar sakta hai — APK nahi chahiye
- APK banane ke liye EAS account chahiye (free hai)
- Claude API ka $5 free credit milta hai — kaafi hai 500+ conversations ke liye

**SPARKY always with you!** 🔥
