export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code } = req.body;
  const validCode = process.env.ACCESS_CODE || 'SPEAKUP2025';

  if (!code || code.trim().toUpperCase() !== validCode.trim().toUpperCase()) {
    return res.status(401).json({ ok: false, message: 'Invalid access code. Please check with your teacher.' });
  }

  return res.status(200).json({ ok: true });
}
