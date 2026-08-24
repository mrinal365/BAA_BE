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

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_secret_key_change_me';
const genToken = (id, role) => jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '1h' });

describe('Artist/Review Endpoints Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  // Test 1: should submit a review successfully
  describe('POST /api/v1/artists/:id/reviews', () => {
    it('should submit a review successfully', async () => {
      const artistId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
      mockBookingRepo.verifyBookingForReview.mockResolvedValue({ id: '8e36ad18-fb1b-4f51-a905-2420a3203f19', artist_role: 'artist' });
      mockReviewModel.findOne.mockResolvedValue(null);
      mockReviewModel.create.mockResolvedValue({ id: 'review-uuid', score: 5, comment: 'Great!' });

      const res = await request(app)
        .post(`/api/v1/artists/${artistId}/reviews`)
        .set('Authorization', `Bearer ${genToken('client-id', 'client')}`)
        .send({ bookingId: '8e36ad18-fb1b-4f51-a905-2420a3203f19', score: 5, comment: 'Great!' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(5);
    });
  });

  // Test 2: should fetch reviews and score summary
  describe('GET /api/v1/artists/:id/reviews', () => {
    it('should fetch reviews and score summary', async () => {
      const artistId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
      mockBookingRepo.findCompletedBookingIdsByArtist.mockResolvedValue(['8e36ad18-fb1b-4f51-a905-2420a3203f19']);
      
      mockReviewModel.find.mockReturnValue({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: () => Promise.resolve([{ score: 5, comment: 'Cool' }])
            })
          })
        })
      });

      mockReviewModel.aggregate.mockResolvedValue([{
        averageScore: 5,
        totalCount: 1,
        score1: 0, score2: 0, score3: 0, score4: 0, score5: 1
      }]);

      const res = await request(app).get(`/api/v1/artists/${artistId}/reviews`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.averageScore).toBe(5);
      expect(res.body.data.reviews).toHaveLength(1);
    });
  });
});
