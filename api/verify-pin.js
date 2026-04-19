const CORRECT_PIN = '8181';
const ALLOWED_ORIGIN = 'https://rbn888.github.io';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false });
  }

  try {
    const { pin } = req.body;
    return res.status(200).json({ success: pin === CORRECT_PIN });
  } catch {
    return res.status(200).json({ success: false });
  }
}
