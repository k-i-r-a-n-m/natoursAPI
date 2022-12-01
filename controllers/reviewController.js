const Review = require('../models/reviewModel');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllReview = catchAsync(async (req, res, next) => {
  let filter = {}
  if (req.params.tourId) filter = { tour:req.params.tourId}
    
  const reviews = await Review.find(filter);

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
  //The TOUR ID from url parameter
  //The USER ID from req object (which is set by the protect middleware from authController)
  if(!req.body.tour) req.body.tour = req.params.tourId
  if (!req.body.user) req.body.user = req.user.id
  
  const newReview = await Review.create(req.body);
  // console.log(req.body);
  res.status(201).json({
    status: 'success',
    data: newReview
  });
});
