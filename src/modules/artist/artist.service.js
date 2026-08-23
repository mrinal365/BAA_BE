import Review from './review.model.js';
import { findCompletedBookingIdsByArtist } from '../booking/booking.repository.js';

export const getArtistReviews = async (artistId, page = 1, limit = 10) => {
  // 1. Fetch completed booking IDs from PostgreSQL for this artist
  const completedBookingIds = await findCompletedBookingIdsByArtist(artistId);

  // If there are no completed bookings, there can be no reviews from completed bookings
  if (!completedBookingIds || completedBookingIds.length === 0) {
    return {
      summary: {
        averageScore: 0,
        totalCount: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
      reviews: [],
      pagination: {
        page,
        limit,
        totalPages: 0,
        totalReviews: 0,
      },
    };
  }

  // 2. Filter MongoDB reviews matching the completed bookings
  const filter = {
    artistId,
    bookingId: { $in: completedBookingIds },
  };

  const skip = (page - 1) * limit;

  // Run the paginated query and aggregation concurrently
  const [reviews, stats] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$score' },
          totalCount: { $sum: 1 },
          score1: { $sum: { $cond: [{ $eq: ['$score', 1] }, 1, 0] } },
          score2: { $sum: { $cond: [{ $eq: ['$score', 2] }, 1, 0] } },
          score3: { $sum: { $cond: [{ $eq: ['$score', 3] }, 1, 0] } },
          score4: { $sum: { $cond: [{ $eq: ['$score', 4] }, 1, 0] } },
          score5: { $sum: { $cond: [{ $eq: ['$score', 5] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const hasStats = stats.length > 0;
  const totalCount = hasStats ? stats[0].totalCount : 0;
  const averageScore = hasStats ? parseFloat(stats[0].averageScore.toFixed(2)) : 0.00;

  const distribution = {
    1: hasStats ? stats[0].score1 : 0,
    2: hasStats ? stats[0].score2 : 0,
    3: hasStats ? stats[0].score3 : 0,
    4: hasStats ? stats[0].score4 : 0,
    5: hasStats ? stats[0].score5 : 0,
  };

  const totalPages = Math.ceil(totalCount / limit);

  return {
    summary: {
      averageScore,
      totalCount,
      distribution,
    },
    reviews,
    pagination: {
      page,
      limit,
      totalPages,
      totalReviews: totalCount,
    },
  };
};
