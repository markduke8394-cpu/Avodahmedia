import { Router, Request, Response } from 'express';
import pool, { query } from '../config/database.js';
import jwt from 'jsonwebtoken';

const router = Router();

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

// Middleware to verify JWT token
export const authMiddleware = async (req: AuthRequest, res: Response, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded as any;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await query(`SELECT * FROM team_members WHERE email = $1 AND is_active = true`, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // For MVP: simple password check (in production, use bcrypt)
    // TODO: Implement bcrypt password hashing
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`SELECT id, name, email, phone, role FROM team_members WHERE id = $1`, [req.user?.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Logout (no-op, client deletes token)
router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
