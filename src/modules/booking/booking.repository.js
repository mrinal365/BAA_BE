import pool from '../../database/postgress.js';
import crypto from 'crypto';
import { BOOKING_STATUS } from '../../enums/booking.js';

// Automatically ensure the bookings table exists in PostgreSQL when module is loaded
const initTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY,
      artist_id UUID REFERENCES users(id) NOT NULL,
      client_id UUID REFERENCES users(id) NOT NULL,
      event_start TIMESTAMP NOT NULL,
      event_end TIMESTAMP NOT NULL,
      notes TEXT,
      status VARCHAR(50) CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
  } catch (error) {
    console.error('Failed to initialize bookings table in PostgreSQL:', error.message);
  }
};

initTable();

export const checkBookingOverlap = async (artistId, eventStart, eventEnd) => {
  const query = `
    SELECT id FROM bookings 
    WHERE artist_id = $1 
      AND status = $2
      AND event_start < $4 
      AND event_end > $3;
  `;
  const values = [artistId, BOOKING_STATUS.CONFIRMED, eventStart, eventEnd];
  const res = await pool.query(query, values);
  return res.rows.length > 0;
};

export const createBookingRecord = async (bookingData) => {
  const { artistId, clientId, eventStart, eventEnd, notes } = bookingData;
  const id = crypto.randomUUID();

  const query = `
    INSERT INTO bookings (id, artist_id, client_id, event_start, event_end, notes, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const values = [id, artistId, clientId, eventStart, eventEnd, notes || null, BOOKING_STATUS.PENDING];
  const res = await pool.query(query, values);
  return res.rows[0];
};

export const findBookingById = async (id) => {
  const query = 'SELECT * FROM bookings WHERE id = $1;';
  const res = await pool.query(query, [id]);
  return res.rows[0] || null;
};

export const updateBookingStatus = async (id, status) => {
  const query = `
    UPDATE bookings 
    SET status = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *;
  `;
  const res = await pool.query(query, [id, status]);
  return res.rows[0];
};

export const findCompletedBookingIdsByArtist = async (artistId) => {
  const query = "SELECT id FROM bookings WHERE artist_id = $1 AND status = 'completed';";
  const res = await pool.query(query, [artistId]);
  return res.rows.map(row => row.id);
};

export const getBookingsByUser = async (userId, limit, offset) => {
  const listQuery = `
    SELECT * FROM bookings 
    WHERE client_id = $1 OR artist_id = $1 
    ORDER BY created_at DESC 
    LIMIT $2 OFFSET $3;
  `;
  const countQuery = `
    SELECT COUNT(*) FROM bookings 
    WHERE client_id = $1 OR artist_id = $1;
  `;

  const [listRes, countRes] = await Promise.all([
    pool.query(listQuery, [userId, limit, offset]),
    pool.query(countQuery, [userId]),
  ]);

  return {
    bookings: listRes.rows,
    total: parseInt(countRes.rows[0].count, 10),
  };
};

export const verifyBookingForReview = async (bookingId, clientId, artistId) => {
  const query = `
    SELECT b.*, u.role AS artist_role 
    FROM bookings b
    JOIN users u ON b.artist_id = u.id
    WHERE b.id = $1 AND b.client_id = $2 AND b.artist_id = $3 AND b.status = 'completed';
  `;
  const res = await pool.query(query, [bookingId, clientId, artistId]);
  return res.rows[0] || null;
};
