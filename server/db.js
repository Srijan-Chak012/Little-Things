import pg from 'pg';

const { Pool } = pg;

// Render provides DATABASE_URL. For local dev, fall back to a local Postgres URL
// or individual PG* env vars supported natively by node-postgres.
const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/little_things';

// Render's managed Postgres requires SSL. Enable it when connecting to a non-local host.
const useSSL = /render\.com|amazonaws\.com|\bsslmode=require\b/.test(connectionString);

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

/** Run a parameterized query. Returns the pg result. */
export function query(text, params) {
  return getPool().query(text, params);
}

export async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS scribbles (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL,
      image_data TEXT NOT NULL,
      emoji TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      description TEXT DEFAULT '',
      name TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
}

