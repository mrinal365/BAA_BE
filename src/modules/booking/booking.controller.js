import { createBooking, changeBookingStatus } from './booking.service.js';
import { CreateBookingSchema, UpdateBookingStatusSchema } from './booking.schema.js';
import { createAppError } from '../../utils/appError.js';
import { USER_ROLES } from '../../enums/user.js';

export const createBookingController = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.CLIENT) {
      throw createAppError('Only clients can create bookings', 403);
    }
    const validatedData = CreateBookingSchema.parse(req.body);

    const booking = await createBooking({
      ...validatedData,
      clientId: req.user.id,
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

export const updateBookingStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = UpdateBookingStatusSchema.parse(req.body);

    const booking = await changeBookingStatus(id, validatedData.status, req.user);

    return res.status(200).json({
      success: true,
      data: booking,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
