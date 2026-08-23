import { Router } from 'express';
import { getArtistReviewsController, createArtistReviewController } from './artist.controller.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = Router();

router.get('/:id/reviews', getArtistReviewsController);
router.post('/:id/reviews', requireAuth, createArtistReviewController);

export default router;
