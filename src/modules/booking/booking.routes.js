import { Router } from 'express';
import { createBookingController, updateBookingStatusController, getBookingsController } from './booking.controller.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, getBookingsController);
router.post('/', requireAuth, createBookingController);
router.patch('/:id/status', requireAuth, updateBookingStatusController);

export default router;
