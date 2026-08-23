import { Router } from 'express';
import { createBookingController, updateBookingStatusController } from './booking.controller.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = Router();

router.post('/', requireAuth, createBookingController);
router.patch('/:id', requireAuth, updateBookingStatusController);

export default router;
