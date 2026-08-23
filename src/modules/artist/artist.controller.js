import { getArtistReviews } from './artist.service.js';
import { z } from 'zod';

const GetReviewsParamsSchema = z.object({
  id: z.string().uuid('Invalid artist_id format'),
});

const GetReviewsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
});

export const getArtistReviewsController = async (req, res, next) => {
  try {
    // 1. Validate params and queries
    const { id } = GetReviewsParamsSchema.parse(req.params);
    const { page, limit } = GetReviewsQuerySchema.parse(req.query);

    // 2. Fetch reviews from service
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
