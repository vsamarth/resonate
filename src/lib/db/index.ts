/**
 * Drizzle DB client — only import this from server-side code
 * (+page.server.ts, +server.ts, hooks.server.ts).
 * Uses dynamic/private so DATABASE_URL is read at runtime from .env.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

const url = env?.DATABASE_URL;
if (!url) {
	throw new Error(
		'DATABASE_URL is not set. Create frontend/.env with:\n  DATABASE_URL=postgresql://resonate:resonate@localhost:5432/resonate'
	);
}

const pool = new Pool({ connectionString: url });

export const db = drizzle(pool, { schema });
export { schema };
