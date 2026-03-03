import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "No database URL found. Set POSTGRES_URL (Vercel/Supabase) or DATABASE_URL.",
  );
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("supabase.com") || connectionString.includes("supabase.co")
    ? { rejectUnauthorized: false }
    : undefined,
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });
