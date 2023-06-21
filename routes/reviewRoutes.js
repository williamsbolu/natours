const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // mergeParams allows us to get access to the tourId that coes from "router.use('/:tourId/reviews',)

// POST tour/IDtour1234/reviews
// POST tour/reviews

// Protects all routes after this middlware
router.use(authController.protect);

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),
        reviewController.setTourUserIds,
        reviewController.createReview
    );

router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;

// authController.protects: protects the routes to only be accessed by users who are authenticated
// into the restrictTo() we pass in the role allowed to interact/access the "createReview" resource
