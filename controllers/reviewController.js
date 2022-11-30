const Review = require('../models/reviewModel');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllReview = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();

  if (!reviews) {
    return next(new AppError('No reviews found', 404));
  }

  res.status(200).json({
      status: 'success',
      result:reviews.length,
    data: reviews
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  const newReview = await Review.create(req.body);
  // console.log(req.body);
  res.status(201).json({
    status: 'success',
    data: newReview
  });
});
