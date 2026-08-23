import { createBooking } from './booking.service.js';
import { CreateBookingSchema } from './booking.schema.js';
import { createAppError } from '../../utils/appError.js';
import { USER_ROLES } from '../../enums/user.js';

export const createBookingController = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.CLIENT) {
      throw createAppError('Only clients can create bookings', 403);
    }
    const validatedData = CreateBookingSchema.parse(req.body);

    // 3. Coordinate creation
    const booking = await createBooking({
      ...validatedData,
      clientId: req.user.id, // client_id comes from auth token
    });

    return res.status(201).json({
      success: true,
      data: booking,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
