import { Router, Response } from 'express';
import { AuthRequest, auth, requireRole } from '../middleware/auth.js';

const router = Router();
const orgs: Record<string, { name: string; plan: string; members: { email: string; role: string }[]; stats: { users: number; revenue: number; growth: number } }> = {};

router.get('/', auth, (req: AuthRequest, res: Response) => {
  const org = orgs[req.user!.orgId!];
  if (!org) return res.json({ name: 'My Organization', plan: 'free', members: [{ email: req.user!.email, role: 'admin' }], stats: { users: 1, revenue: 0, growth: 0 } });
  res.json(org);
});

router.put('/', auth, (req: AuthRequest, res: Response) => {
  if (!orgs[req.user!.orgId!]) orgs[req.user!.orgId!] = { name: '', plan: 'free', members: [{ email: req.user!.email, role: 'admin' }], stats: { users: 1, revenue: 0, growth: 0 } };
  orgs[req.user!.orgId!].name = req.body.name || orgs[req.user!.orgId!].name;
  res.json(orgs[req.user!.orgId!]);
});

router.get('/members', auth, (req: AuthRequest, res: Response) => {
  const org = orgs[req.user!.orgId!];
  res.json(org?.members || [{ email: req.user!.email, role: 'admin' }]);
});

router.post('/members', auth, requireRole('admin'), (req: AuthRequest, res: Response) => {
  if (!orgs[req.user!.orgId!]) return res.status(404).json({ error: 'Org not found' });
  orgs[req.user!.orgId!].members.push({ email: req.body.email, role: req.body.role || 'member' });
  res.json(orgs[req.user!.orgId!].members);
});

export { router as orgRouter };
