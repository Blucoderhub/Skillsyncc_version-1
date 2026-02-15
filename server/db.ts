import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

let dbInstance: any;

// Vercel Postgres support (migrated to Neon)
if (process.env.VERCEL && process.env.POSTGRES_URL) {
  // Use Neon Postgres in production
  const { neon } = require("@neondatabase/serverless");
  const { drizzle: neonDrizzle } = require("drizzle-orm/neon-http");
  const sql = neon(process.env.POSTGRES_URL);
  dbInstance = neonDrizzle(sql, { schema });
} else if (process.env.DATABASE_URL) {
  // Use local PostgreSQL for development
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  dbInstance = drizzle(pool, { schema });
} else {
  throw new Error(
    "DATABASE_URL must be set for local development, or POSTGRES_URL for Vercel deployment.",
  );
}

export const db = dbInstance;
export const pool = process.env.VERCEL ? null : new Pool({ connectionString: process.env.DATABASE_URL });
