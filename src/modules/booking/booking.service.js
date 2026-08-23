import { checkBookingOverlap, createBookingRecord, findBookingById, updateBookingStatus } from './booking.repository.js';
import { createAppError } from '../../utils/appError.js';
import { BOOKING_STATUS } from '../../enums/booking.js';
import { USER_ROLES } from '../../enums/user.js';

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

export const changeBookingStatus = async (id, newStatus, actor) => {
  // 1. Find booking
  const booking = await findBookingById(id);
  if (!booking) {
    throw createAppError('Booking not found', 404);
  }

  const isArtist = (booking.artist_id === actor.id);
  const isClient = (booking.client_id === actor.id);

  // 2. Role check
  if (!isArtist && !isClient) {
    throw createAppError('Access denied', 403);
  }

  // 3. Role based restrictions
  // A client can only cancel — not confirm or complete
  if (actor.role === USER_ROLES.CLIENT && newStatus !== BOOKING_STATUS.CANCELLED) {
    throw createAppError('Clients are only allowed to cancel bookings', 403);
  }

  // An artist can only update bookings assigned to them
  if (actor.role === USER_ROLES.ARTIST && !isArtist) {
    throw createAppError('Artists can only update bookings assigned to them', 403);
  }

  const current = booking.status;

  if (newStatus === current) {
    return booking; // No transition needed
  }

  // 4. Enforce state machine transitions
  let isValidTransition = false;

  if (current === BOOKING_STATUS.PENDING) {
    if (newStatus === BOOKING_STATUS.CONFIRMED || newStatus === BOOKING_STATUS.CANCELLED) {
      isValidTransition = true;
    }
  } else if (current === BOOKING_STATUS.CONFIRMED) {
    if (newStatus === BOOKING_STATUS.IN_PROGRESS || newStatus === BOOKING_STATUS.CANCELLED) {
      isValidTransition = true;
    }
  } else if (current === BOOKING_STATUS.IN_PROGRESS) {
    if (newStatus === BOOKING_STATUS.COMPLETED) {
      isValidTransition = true;
    }
  }

  if (!isValidTransition) {
    throw createAppError(`Invalid status transition from '${current}' to '${newStatus}'`, 422);
  }

  // 5. Time-based transition validations 
  const now = new Date();

  // confirmed --> in_progress (event has started)
  if (newStatus === BOOKING_STATUS.IN_PROGRESS) {
    if (new Date(booking.event_start) > now) {
      throw createAppError('Cannot transition to in_progress before the event has started', 422);
    }
  }

  // in_progress --> completed (event is done)
  if (newStatus === BOOKING_STATUS.COMPLETED) {
    if (new Date(booking.event_end) > now) {
      throw createAppError('Cannot transition to completed before the event is done', 422);
    }
  }

  // 6. Update booking status
  return await updateBookingStatus(id, newStatus);
};
