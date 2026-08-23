import { z } from 'zod';

export const CreateBookingSchema = z.object({
  artistId: z.string().uuid('Invalid artist_id format'),
  eventStart: z.string().datetime({ message: 'event_start must be a valid ISO datetime string' }),
  eventEnd: z.string().datetime({ message: 'event_end must be a valid ISO datetime string' }),
  notes: z.string().optional(),
});
