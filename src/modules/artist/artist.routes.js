import { Router } from 'express';
import { getArtistReviewsController } from './artist.controller.js';

const router = Router();

router.get('/:id/reviews', getArtistReviewsController);

export default router;
