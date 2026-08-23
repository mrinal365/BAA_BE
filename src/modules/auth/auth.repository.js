import pool from '../../database/postgress.js';
import crypto from 'crypto';

// Automatically ensure the users table exists in PostgreSQL when module is loaded
const initTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) CHECK (role IN ('artist', 'client')) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
  } catch (error) {
    console.error('Failed to initialize users table in PostgreSQL:', error.message);
  }
};

initTable();

export const findUserByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = $1;';
  const res = await pool.query(query, [email]);
  return res.rows[0] || null;
};

export const createUser = async (userData) => {
  const { email, passwordHash, role } = userData;
  const id = crypto.randomUUID();

  const query = `
    INSERT INTO users (id, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, role, created_at, updated_at;
  `;
  const values = [id, email, passwordHash, role];
  const res = await pool.query(query, values);
  
  return res.rows[0];
};
