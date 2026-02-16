import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "DATABASE_URL or POSTGRES_URL must be set. " +
    "Did you forget to add a PostgreSQL extension or set environment variables?",
  );
}

let dbInstance;

if (process.env.VERCEL || process.env.POSTGRES_URL?.includes("neon.tech")) {
  // Use Neon Postgres in production/cloud
  const { neon } = require("@neondatabase/serverless");
  const { drizzle: neonDrizzle } = require("drizzle-orm/neon-http");
  const sql = neon(dbUrl);
  dbInstance = neonDrizzle(sql, { schema });
} else {
  // Use local PostgreSQL for development
  const pool = new Pool({ connectionString: dbUrl });
  dbInstance = drizzle(pool, { schema });
}

export const db = dbInstance;
export const pool = process.env.VERCEL ? null : new Pool({ connectionString: process.env.DATABASE_URL });
