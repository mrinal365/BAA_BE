import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

jest.unstable_mockModule(path.resolve(__dirname, '../src/modules/auth/auth.repository.js'), () => mockAuthRepo);
jest.unstable_mockModule(path.resolve(__dirname, '../src/modules/booking/booking.repository.js'), () => mockBookingRepo);
jest.unstable_mockModule(path.resolve(__dirname, '../src/modules/artist/review.model.js'), () => ({ default: mockReviewModel }));

const app = (await import('../src/app.js')).default;
const { findBookingById, updateBookingStatus } = await import('../src/modules/booking/booking.repository.js');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_secret_key_change_me';
const genToken = (id, role) => jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '1h' });

describe('Booking Endpoints Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  // Test 1: should prevent artists from creating bookings (returns 403)
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

  // Test 2: should fetch list of bookings for the user
  describe('GET /api/v1/bookings', () => {
    it('should fetch list of bookings for the user', async () => {
      mockBookingRepo.getBookingsByUser.mockResolvedValue({
        bookings: [{ id: 'booking-uuid', status: 'pending' }],
        total: 1,
      });

      const res = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${genToken('user-id', 'client')}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookings).toHaveLength(1);
    });
  });

  // Test 3: should reject invalid state transitions with HTTP 422
  // Test 4: should allow valid transitions (pending -> confirmed) for artists
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
});
