# oink
Personalized AI speech coach. Built around exercises from real coaching sessions.

## Run locally

1. `npm install`
2. Copy your Deepgram API key into `.env.local`:
   ```
   DEEPGRAM_API_KEY=your_key_here
   ```
3. `npm run dev` and open http://localhost:3000.

The MVP includes one drill ("Oink"): pick a topic, speak for two minutes replacing every "I" with "oink", and see your misses highlighted in the transcript with clickable timestamps.
