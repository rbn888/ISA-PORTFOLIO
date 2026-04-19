const CORRECT_PIN = '8181';
const ALLOWED_ORIGIN = 'https://rbn888.github.io';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

const attempts = {};

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

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  const now = Date.now();
  const record = attempts[ip];

  if (record) {
    if (now - record.firstAttempt < WINDOW_MS) {
      if (record.count >= MAX_ATTEMPTS) {
        return res.status(429).json({ success: false, error: 'rate_limited' });
      }
      record.count++;
    } else {
      attempts[ip] = { count: 1, firstAttempt: now };
    }
  } else {
    attempts[ip] = { count: 1, firstAttempt: now };
  }

  try {
    const { pin } = req.body;
    return res.status(200).json({ success: pin === CORRECT_PIN });
  } catch {
    return res.status(200).json({ success: false });
  }
}
