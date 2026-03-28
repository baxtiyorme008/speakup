module.exports = function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code } = req.body;
  if (!code) return res.status(400).json({ ok: false, message: 'Please enter your access code.' });

  const validCode = process.env.ACCESS_CODE || 'SPEAKUP2025';

  if (code.trim().toUpperCase() === validCode.trim().toUpperCase()) {
    return res.status(200).json({ ok: true, name: '' });
  }

  return res.status(401).json({ ok: false, message: 'Code not found. Please check with your teacher.' });
};
