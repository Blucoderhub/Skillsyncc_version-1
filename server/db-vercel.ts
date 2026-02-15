import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "@shared/schema";

// Vercel Postgres configuration
export const db = drizzle(sql, { schema });

// Fallback for local development
if (!process.env.VERCEL && process.env.DATABASE_URL) {
  const { drizzle: localDrizzle } = require("drizzle-orm/node-postgres");
  const pg = require("pg");
  const { Pool } = pg;
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  module.exports.db = localDrizzle(pool, { schema });
}