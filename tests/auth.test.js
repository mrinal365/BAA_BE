import request from 'supertest';
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
const { findUserByEmail } = await import('../src/modules/auth/auth.repository.js');

describe('Auth Endpoints Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  // Test 1: should register a new user successfully
  describe('POST /api/v1/auth/signup', () => {
    it('should register a new user successfully', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthRepo.createUser.mockResolvedValue({ id: 'user-uuid', email: 'test@example.com', role: 'client' });

      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'test@example.com', password: 'Password123!', role: 'client' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@example.com');
    });
  });

  // Test 2: should return 400 for empty payload validation errors
  // Test 3: should return 401 for incorrect credentials
  describe('POST /api/v1/auth/login', () => {
    it('should return 400 for empty payload validation errors', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for incorrect credentials', async () => {
      findUserByEmail.mockResolvedValue(null);
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'wrong@example.com', password: 'password123' });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
