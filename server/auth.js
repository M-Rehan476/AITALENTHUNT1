import jwt from 'jsonwebtoken';
import db from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-talent-hunt-secret-key-2024';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name, is_verified: user.is_verified, can_post_jobs: user.can_post_jobs },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function verifiedMiddleware(req, res, next) {
  if (req.user.role !== 'admin' && !req.user.is_verified) {
    return res.status(403).json({ error: 'Your account is pending admin approval.' });
  }
  next();
}

export function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
