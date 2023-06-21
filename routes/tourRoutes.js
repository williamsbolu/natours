const express = require('express');
const tourController = require('../controllers/tourController'); // destructuring can also be used to pull out d function
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router(); // create a new router // its also a middleware

// Params middleware
// router.param('id', tourController.checkID);

// Nested Routes
// POST tour/IDtour1234/reviews
// GET tour/IDtour1234/reviews

// router.use() middleware basically means the tour router should use the "review router" incase it ever encounters a route like this.
router.use('/:tourId/reviews', reviewRouter);

// Aliasing
router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
    .route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan
    );

router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);
// /tours-within/233/center/-40,45/unit/mi
// /tours-within?distance=233&center=-40,45&unit=1 // Query-string

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
    .route('/')
    .get(tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTour
    );

// .post(tourController.checkBody, tourController.createTour);
// Here in (post), we chained middleware functions

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    );

module.exports = router;

// the .delete route controlller is protected "protect" and is also restricted by the "restrictTo()" middleware function then
// into the restrictTo() we pass in all the roles allowed to interact/access the "tourController.deleteTour" resource/function
