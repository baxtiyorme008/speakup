# SpeakUP! — IELTS Speaking Assessment Platform
**By IELTS PEAK**

---

## Project Structure

```
speakup/
├── index.html          ← Main site (all 7 screens)
├── vercel.json         ← Vercel routing config
├── api/
│   ├── auth.js         ← Access code verification
│   ├── transcribe.js   ← Groq Whisper STT
│   └── feedback.js     ← Groq LLaMA IELTS scoring
└── audio/              ← (Optional) ElevenLabs MP3 files
    ├── p1-intro.mp3
    ├── p1-q1.mp3
    ├── p1-q2.mp3
    ├── p1-q3.mp3
    ├── p1-q4.mp3
    ├── p2-intro.mp3
    ├── p2-cue.mp3      ← (play before prep timer starts)
    ├── p3-intro.mp3
    ├── p3-q1.mp3
    ├── p3-q2.mp3
    ├── p3-q3.mp3
    └── p3-q4.mp3
```

---

## Deployment to Vercel

### Step 1 — Push to GitHub
```bash
cd speakup
git init
git add .
git commit -m "Initial SpeakUP! deployment"
git remote add origin https://github.com/YOUR_USERNAME/speakup.git
git push -u origin main
```

### Step 2 — Import to Vercel
1. Go to **vercel.com** → New Project
2. Import your `speakup` GitHub repository
3. Framework preset: **Other** (no framework)
4. Click Deploy

### Step 3 — Set Environment Variables
In Vercel → Project → Settings → Environment Variables, add:

| Name | Value |
|------|-------|
| `GROQ_API_KEY` | Your Groq API key (starts with `gsk_`) |
| `ACCESS_CODE` | Your chosen code e.g. `SPEAKUP2025` |

Then go to **Deployments** → redeploy for env vars to take effect.

---

## Adding ElevenLabs Voice (Your Real Voice)

1. Go to elevenlabs.io → Voice Lab → Add Generative Voice
2. Upload 5–10 minutes of your clean recordings
3. Once cloned, use the API or web interface to generate each audio file
4. Name and place files in `/audio/` folder (see structure above)
5. In `index.html`, set: `const USE_ELEVENLABS_AUDIO = true;`

**Script for generating MP3s via ElevenLabs API:**
```javascript
// run with: node generate-audio.js
const ELEVEN_KEY = 'your_key_here';
const VOICE_ID   = 'your_voice_id_here';

const scripts = {
  'p1-intro': "Good morning. My name is IELTS Peak examiner, and I'll be conducting your IELTS Speaking test today...",
  'p1-q1':    "Where are you from originally?",
  'p1-q2':    "What do you like most about your hometown?",
  // ... add all questions
};

for (const [filename, text] of Object.entries(scripts)) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': ELEVEN_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' })
  });
  const buf = await res.arrayBuffer();
  require('fs').writeFileSync(`audio/${filename}.mp3`, Buffer.from(buf));
  console.log(`Generated: ${filename}.mp3`);
}
```

---

## Customising Questions

Edit the `QB` object at the top of `index.html`:
- Change `QB.part1.questions` — array of strings (4–5 questions)
- Change `QB.part2.cue` — topic and bullet points
- Change `QB.part3.questions` — array of strings (4–5 questions)
- Change `QB.*.intro` — the text the examiner reads at the start of each part

---

## Access Code Management

- Set `ACCESS_CODE` env var in Vercel to control who can access
- Give each student (or cohort) the same code
- To rotate, just update the env var and redeploy
- For per-student codes, update `api/auth.js` to check against a list

---

## Cost Estimate (70 students, 3 tests/week)

| Service | Monthly Cost |
|---------|-------------|
| Groq (Whisper + LLaMA) | Free tier |
| ElevenLabs Creator plan | ~$22/month |
| Vercel | Free |
| **Total** | **~$22/month** |
