import jwt from 'jsonwebtoken';

export function verifyTinyTalkersToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    if (payload.product !== 'tiny-talkers') throw new Error('Wrong product token');
    req.tinyTalkersUser = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Sign in again.' });
  }
}

export function requireTinyTalkersAdmin(req, res, next) {
  if (req.tinyTalkersUser?.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access is required.' });
  }
  next();
}