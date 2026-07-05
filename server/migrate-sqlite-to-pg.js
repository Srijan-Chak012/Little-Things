/**
 * One-time migration: copies data from the legacy SQLite database (data.db)
 * into the PostgreSQL database defined by DATABASE_URL.
 *
 * Usage (from the server/ folder):
 *   npm install better-sqlite3        # temporary dependency
 *   node --env-file=.env migrate-sqlite-to-pg.js
 *   npm uninstall better-sqlite3      # clean up afterwards
 *
 * Safe to run multiple times — existing rows are skipped (ON CONFLICT DO NOTHING).
 */
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { getPool, initDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQLITE_PATH = path.join(__dirname, 'data.db');

async function migrate() {
  console.log('Opening SQLite database:', SQLITE_PATH);
  const sqlite = new Database(SQLITE_PATH, { readonly: true, fileMustExist: true });

  // Ensure the Postgres tables exist
  await initDb();
  const pool = getPool();

  // ---- Users ----
  const users = sqlite.prepare('SELECT * FROM users').all();
  console.log(`Found ${users.length} user(s) in SQLite.`);

  // Map old SQLite user ids -> new Postgres user ids (ids may differ)
  const idMap = new Map();

  for (const u of users) {
    // Insert by username; if it already exists, reuse the existing row.
    const res = await pool.query(
      `INSERT INTO users (username, password_hash, created_at)
       VALUES ($1, $2, COALESCE($3::timestamptz, now()))
       ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
       RETURNING id`,
      [u.username, u.password_hash, u.created_at || null]
    );
    idMap.set(u.id, res.rows[0].id);
    console.log(`  user "${u.username}": sqlite id ${u.id} -> pg id ${res.rows[0].id}`);
  }

  // ---- Scribbles ----
  const scribbles = sqlite.prepare('SELECT * FROM scribbles').all();
  console.log(`Found ${scribbles.length} scribble(s) in SQLite.`);

  let migrated = 0;
  for (const s of scribbles) {
    const newUserId = idMap.get(s.user_id);
    if (!newUserId) {
      console.warn(`  skipping scribble ${s.id} — no matching user for user_id ${s.user_id}`);
      continue;
    }

    await pool.query(
      `INSERT INTO scribbles (id, user_id, timestamp, image_data, emoji, tags, description, name, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::timestamptz, now()))
       ON CONFLICT (id) DO NOTHING`,
      [
        s.id,
        newUserId,
        s.timestamp,
        s.image_data,
        s.emoji ?? '',
        s.tags ?? '[]',
        s.description ?? '',
        s.name ?? '',
        s.created_at || null,
      ]
    );
    migrated++;
  }

  console.log(`Migrated ${migrated} scribble(s).`);

  sqlite.close();
  await pool.end();
  console.log('Migration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
