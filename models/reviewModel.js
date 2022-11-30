const mongoose = require('mongoose');

const reveiwSchema = new mongoose.Schema(
  {
    review: String,

    rating: {
      type: Number,
      min: 1,
      max: 5
    },

    createdAt: {
      type: Date,
      default: Date.now()
    },

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a User']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.model('Review', reveiwSchema);
