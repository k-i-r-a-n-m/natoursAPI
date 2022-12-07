const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({mergeParams:true});   //the parameter from previous or parent route is accessed 

router
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authController.protect,
    authController.restrict('user'),
    reviewController.createReview
  );

router.route('/:id')
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview)

module.exports = router;
