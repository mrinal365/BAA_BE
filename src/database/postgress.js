import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.PG_MAX_POOL, 10) || 10,
  min: parseInt(process.env.PG_MIN_POOL, 10) || 2,
});

export const connectPostgres = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected successfully');
    client.release();
  } catch (error) {
    console.error('PostgreSQL connection error:', error.message);
  }
};

export default pool;
