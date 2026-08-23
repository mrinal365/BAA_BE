import { Router } from 'express';
import { createBookingController } from './booking.controller.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = Router();

router.post('/', requireAuth, createBookingController);

export default router;
