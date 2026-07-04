import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();

// Get all scribbles for logged-in user
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const scribbles = db.prepare(
    'SELECT * FROM scribbles WHERE user_id = ? ORDER BY timestamp DESC'
  ).all(req.userId);

  const parsed = scribbles.map(s => {
    let emoji = s.emoji;
    try { emoji = JSON.parse(s.emoji); } catch { emoji = s.emoji ? [s.emoji] : []; }
    return {
      id: s.id,
      timestamp: s.timestamp,
      imageData: s.image_data,
      emoji,
      tags: JSON.parse(s.tags),
      description: s.description,
      name: s.name,
    };
  });

  res.json({ scribbles: parsed });
});

// Save a single scribble
router.post('/', authMiddleware, (req, res) => {
  const { id, timestamp, imageData, emoji, tags, description, name } = req.body;

  if (!id || !imageData) {
    return res.status(400).json({ error: 'id and imageData are required' });
  }

  const db = getDb();

  // Upsert: insert or replace
  db.prepare(`
    INSERT OR REPLACE INTO scribbles (id, user_id, timestamp, image_data, emoji, tags, description, name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    req.userId,
    timestamp || new Date().toISOString(),
    imageData,
    JSON.stringify(emoji || []),
    JSON.stringify(tags || []),
    description || '',
    name || ''
  );

  res.json({ success: true });
});

// Sync multiple scribbles (bulk upload from localStorage)
router.post('/sync', authMiddleware, (req, res) => {
  const { scribbles } = req.body;

  if (!Array.isArray(scribbles)) {
    return res.status(400).json({ error: 'scribbles must be an array' });
  }

  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO scribbles (id, user_id, timestamp, image_data, emoji, tags, description, name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const syncMany = db.transaction((items) => {
    for (const s of items) {
      insert.run(
        s.id,
        req.userId,
        s.timestamp || new Date().toISOString(),
        s.imageData,
        JSON.stringify(s.emoji || []),
        JSON.stringify(s.tags || []),
        s.description || '',
        s.name || ''
      );
    }
  });

  syncMany(scribbles);
  res.json({ success: true, synced: scribbles.length });
});

// Delete a scribble
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM scribbles WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Scribble not found' });
  }
  res.json({ success: true });
});

// Update a scribble
router.put('/:id', authMiddleware, (req, res) => {
  const { emoji, tags, description, name } = req.body;
  const db = getDb();

  db.prepare(`
    UPDATE scribbles SET emoji = ?, tags = ?, description = ?, name = ?
    WHERE id = ? AND user_id = ?
  `).run(
    JSON.stringify(emoji || []),
    JSON.stringify(tags || []),
    description || '',
    name || '',
    req.params.id,
    req.userId
  );

  res.json({ success: true });
});

export default router;
