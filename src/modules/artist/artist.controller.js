import { getArtistReviews, addArtistReview } from './artist.service.js';
import { z } from 'zod';

const GetReviewsParamsSchema = z.object({
  id: z.string().uuid('Invalid artist_id format'),
});

const GetReviewsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
});

const CreateReviewParamsSchema = z.object({
  id: z.string().uuid('Invalid artist_id format'),
});

const CreateReviewBodySchema = z.object({
  bookingId: z.string().uuid('Invalid booking_id format'),
  score: z.number().int().min(1).max(5, 'Score must be between 1 and 5'),
  comment: z.string().trim().optional(),
});

export const getArtistReviewsController = async (req, res, next) => {
  try {
    const { id } = GetReviewsParamsSchema.parse(req.params);
    const { page, limit } = GetReviewsQuerySchema.parse(req.query);

    const result = await getArtistReviews(id, page, limit);

    return res.status(200).json({
      success: true,
      data: result,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const createArtistReviewController = async (req, res, next) => {
  try {
    const { id } = CreateReviewParamsSchema.parse(req.params);
    const validatedData = CreateReviewBodySchema.parse(req.body);

    const review = await addArtistReview(id, validatedData, req.user);

    return res.status(201).json({
      success: true,
      data: review,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
