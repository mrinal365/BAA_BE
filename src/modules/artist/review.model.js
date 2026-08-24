import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
    },
    artistId: {
      type: String,
      required: true,
      index: true,
    },
    clientId: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// composite indexing
ReviewSchema.index({ artistId: 1, bookingId: 1 });

const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

export default Review;
