import { Pool } from "pg";

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const db = new Pool({
  host: getRequiredEnv("POSTGRES_HOST"),
  port: Number(getRequiredEnv("POSTGRES_PORT")),
  user: getRequiredEnv("POSTGRES_USER"),
  password: getRequiredEnv("POSTGRES_PASSWORD"),
  database: getRequiredEnv("POSTGRES_DB")
});

export const initializeDatabase = async (): Promise<void> => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS renders (
      id UUID PRIMARY KEY,
      composition JSONB NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('queued', 'rendering', 'completed', 'failed')),
      created_at TIMESTAMP DEFAULT NOW(),
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      output_url TEXT,
      error TEXT
    )
  `);
};
