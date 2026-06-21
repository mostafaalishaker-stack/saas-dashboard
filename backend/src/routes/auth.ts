import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest, auth } from '../middleware/auth.js';

const router = Router();
const users: { email: string; password: string; name: string; orgId: string; role: string }[] = [];

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email exists' });
    const hashed = await bcrypt.hash(password, 10);
    const orgId = `org_${Date.now()}`;
    users.push({ email, password: hashed, name, orgId, role: 'admin' });
    const token = jwt.sign({ email, orgId, role: 'admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { email, name, orgId, role: 'admin' } });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ email: user.email, orgId: user.orgId, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { email: user.email, name: user.name, orgId: user.orgId, role: user.role } });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/me', auth, (req: AuthRequest, res: Response) => {
  const user = users.find(u => u.email === req.user?.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ email: user.email, name: user.name, orgId: user.orgId, role: user.role });
});

export { router as authRouter };
