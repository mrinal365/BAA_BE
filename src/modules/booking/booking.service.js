import { checkBookingOverlap, createBookingRecord } from './booking.repository.js';
import { createAppError } from '../../utils/appError.js';

export const createBooking = async (bookingData) => {
  const { artistId, clientId, eventStart, eventEnd, notes } = bookingData;

  const start = new Date(eventStart);
  const end = new Date(eventEnd);
  const now = new Date();

  // 1. Reject if event_start is in the past
  if (start < now) {
    throw createAppError('event_start must be in the future', 400);
  }

  // 2. Validate event duration
  if (end <= start) {
    throw createAppError('event_end must be after event_start', 400);
  }

  // 3. Reject if the artist already has a confirmed booking overlapping this time window
  const isOverlapping = await checkBookingOverlap(artistId, eventStart, eventEnd);
  if (isOverlapping) {
    throw createAppError('Artist is already booked for this time window', 409);
  }

  // 4. Create booking
  return await createBookingRecord({
    artistId,
    clientId,
    eventStart,
    eventEnd,
    notes,
  });
};
