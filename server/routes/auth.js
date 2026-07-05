import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db.js';
import { generateToken, authMiddleware } from '../auth.js';
import { asyncHandler } from '../asyncHandler.js';

const router = Router();

// Register
router.post('/register', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Username must be 3-30 characters' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const existing = await query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
    [username, passwordHash]
  );

  const userId = result.rows[0].id;
  const token = generateToken(userId);
  res.json({ token, user: { id: userId, username } });
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const result = await query(
    'SELECT id, username, password_hash FROM users WHERE username = $1',
    [username]
  );
  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = generateToken(user.id);
  res.json({ token, user: { id: user.id, username: user.username } });
}));

// Get current user
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const result = await query('SELECT id, username FROM users WHERE id = $1', [req.userId]);
  const user = result.rows[0];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
}));

// Delete account
router.delete('/account', authMiddleware, asyncHandler(async (req, res) => {
  await query('DELETE FROM scribbles WHERE user_id = $1', [req.userId]);
  await query('DELETE FROM users WHERE id = $1', [req.userId]);
  res.json({ success: true });
}));

export default router;
