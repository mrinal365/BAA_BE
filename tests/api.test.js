import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock repository objects
const mockAuthRepo = { findUserByEmail: jest.fn(), createUser: jest.fn() };
const mockBookingRepo = {
  findBookingById: jest.fn(),
  updateBookingStatus: jest.fn(),
  checkBookingOverlap: jest.fn(),
  createBookingRecord: jest.fn(),
  getBookingsByUser: jest.fn(),
  findCompletedBookingIdsByArtist: jest.fn(),
  verifyBookingForReview: jest.fn(),
};
const mockReviewModel = { findOne: jest.fn(), create: jest.fn(), find: jest.fn(), aggregate: jest.fn() };

// Register mocks for relative, absolute, and URL paths to ensure cross-platform ESM matching
const registerMocks = (mocks) => {
  for (const [relPath, mockData] of Object.entries(mocks)) {
    const abs = path.resolve(__dirname, relPath);
    const forward = abs.replace(/\\/g, '/');

    jest.unstable_mockModule(relPath, mockData);
    jest.unstable_mockModule(abs, mockData);
    jest.unstable_mockModule(forward, mockData);
  }
};

registerMocks({
  '../src/modules/auth/auth.repository.js': () => mockAuthRepo,
  '../src/modules/booking/booking.repository.js': () => mockBookingRepo,
  '../src/modules/artist/review.model.js': () => ({ default: mockReviewModel }),
});

// Import dynamically after mocks are registered
const app = (await import('../src/app.js')).default;
const { findUserByEmail } = await import('../src/modules/auth/auth.repository.js');
const { findBookingById, updateBookingStatus } = await import('../src/modules/booking/booking.repository.js');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_secret_key_change_me';
const genToken = (id, role) => jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '1h' });

describe('API Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/v1/auth/login', () => {
    it('should return 400 for empty payload validation errors', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('email');
    });

    it('should return 401 for incorrect credentials', async () => {
      findUserByEmail.mockResolvedValue(null);
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'wrong@example.com', password: 'password123' });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid email or password');
    });
  });

  describe('PATCH /api/v1/bookings/:id/status', () => {
    const bookingId = '8e36ad18-fb1b-4f51-a905-2420a3203f19';
    const artistId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    const clientId = '27680789-9a74-4b53-a55e-deec2a66e4a2';

    const getMockBooking = (status) => ({
      id: bookingId, artist_id: artistId, client_id: clientId, status,
      event_start: new Date(Date.now() + 86400).toISOString(),
      event_end: new Date(Date.now() + 90000).toISOString(),
    });

    it('should reject invalid state transitions with HTTP 422', async () => {
      findBookingById.mockResolvedValue(getMockBooking('pending'));

      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${genToken(artistId, 'artist')}`)
        .send({ status: 'completed' });

      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid status transition');
    });

    it('should allow valid transitions (pending -> confirmed) for artists', async () => {
      findBookingById.mockResolvedValue(getMockBooking('pending'));
      updateBookingStatus.mockResolvedValue({ id: bookingId, artist_id: artistId, client_id: clientId, status: 'confirmed' });

      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${genToken(artistId, 'artist')}`)
        .send({ status: 'confirmed' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('confirmed');
    });
  });

  describe('POST /api/v1/bookings', () => {
    it('should prevent artists from creating bookings (returns 403)', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${genToken('artist-id', 'artist')}`)
        .send({
          artistId: 'some-artist-id',
          eventStart: new Date(Date.now() + 86400).toISOString(),
          eventEnd: new Date(Date.now() + 90000).toISOString(),
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Only clients can create bookings');
    });
  });
});
