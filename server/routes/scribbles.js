import { Router } from 'express';
import { query, getPool } from '../db.js';
import { authMiddleware } from '../auth.js';
import { asyncHandler } from '../asyncHandler.js';

const router = Router();

// Get all scribbles for logged-in user
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM scribbles WHERE user_id = $1 ORDER BY timestamp DESC',
    [req.userId]
  );

  const parsed = result.rows.map(s => {
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
}));

// Save a single scribble
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { id, timestamp, imageData, emoji, tags, description, name } = req.body;

  if (!id || !imageData) {
    return res.status(400).json({ error: 'id and imageData are required' });
  }

  // Upsert
  await query(
    `INSERT INTO scribbles (id, user_id, timestamp, image_data, emoji, tags, description, name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       timestamp = EXCLUDED.timestamp,
       image_data = EXCLUDED.image_data,
       emoji = EXCLUDED.emoji,
       tags = EXCLUDED.tags,
       description = EXCLUDED.description,
       name = EXCLUDED.name`,
    [
      id,
      req.userId,
      timestamp || new Date().toISOString(),
      imageData,
      JSON.stringify(emoji || []),
      JSON.stringify(tags || []),
      description || '',
      name || '',
    ]
  );

  res.json({ success: true });
}));

// Sync multiple scribbles (bulk upload from localStorage)
router.post('/sync', authMiddleware, asyncHandler(async (req, res) => {
  const { scribbles } = req.body;

  if (!Array.isArray(scribbles)) {
    return res.status(400).json({ error: 'scribbles must be an array' });
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    for (const s of scribbles) {
      await client.query(
        `INSERT INTO scribbles (id, user_id, timestamp, image_data, emoji, tags, description, name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          s.id,
          req.userId,
          s.timestamp || new Date().toISOString(),
          s.imageData,
          JSON.stringify(s.emoji || []),
          JSON.stringify(s.tags || []),
          s.description || '',
          s.name || '',
        ]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.json({ success: true, synced: scribbles.length });
}));

// Delete a scribble
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await query(
    'DELETE FROM scribbles WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Scribble not found' });
  }
  res.json({ success: true });
}));

// Update a scribble
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { emoji, tags, description, name } = req.body;

  await query(
    `UPDATE scribbles SET emoji = $1, tags = $2, description = $3, name = $4
     WHERE id = $5 AND user_id = $6`,
    [
      JSON.stringify(emoji || []),
      JSON.stringify(tags || []),
      description || '',
      name || '',
      req.params.id,
      req.userId,
    ]
  );

  res.json({ success: true });
}));

export default router;
