export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Forward multipart audio to Groq Whisper
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'API key not configured' });

  // Collect raw body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const contentType = req.headers['content-type'];

  const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': contentType,
    },
    body,
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    return res.status(groqRes.status).json({ error: err });
  }

  const data = await groqRes.json();
  return res.status(200).json({ text: data.text || '' });
}
