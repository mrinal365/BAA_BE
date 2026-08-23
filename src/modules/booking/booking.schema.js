import { z } from 'zod';
import { BOOKING_STATUS } from '../../enums/booking.js';

export const CreateBookingSchema = z.object({
  artistId: z.string().uuid('Invalid artist_id format'),
  eventStart: z.string().datetime({ message: 'event_start must be a valid ISO datetime string' }),
  eventEnd: z.string().datetime({ message: 'event_end must be a valid ISO datetime string' }),
  notes: z.string().optional(),
});

export const UpdateBookingStatusSchema = z.object({
  status: z.enum(Object.values(BOOKING_STATUS), {
    errorMap: () => ({ message: `Status must be one of: ${Object.values(BOOKING_STATUS).join(', ')}` }),
  }),
});
