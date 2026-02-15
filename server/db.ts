import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

let dbInstance: any;

// Vercel Postgres support
if (process.env.VERCEL && process.env.POSTGRES_URL) {
  // Use Vercel Postgres in production
  const { sql } = require("@vercel/postgres");
  const { drizzle: vercelDrizzle } = require("drizzle-orm/vercel-postgres");
  dbInstance = vercelDrizzle(sql, { schema });
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
