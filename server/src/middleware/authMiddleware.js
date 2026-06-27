import jwt from 'jsonwebtoken';

export function authRequired(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: { message: 'Missing token', code: 'NO_TOKEN' } });
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ error: { message: 'Forbidden for this role', code: 'WRONG_ROLE' } });
      }
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ error: { message: 'Invalid or expired token', code: 'BAD_TOKEN' } });
    }
  };
}
