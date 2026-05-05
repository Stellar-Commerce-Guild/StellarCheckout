import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const token = auth.slice(7);
  if (token !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
}

// Attach merchant_id from API key (simplified — in prod, look up from DB)
export function merchantId(req: Request): string {
  const auth = req.headers.authorization || '';
  return Buffer.from(auth.slice(7)).toString('base64').substring(0, 16);
}
