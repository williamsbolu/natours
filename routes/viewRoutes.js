const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingsController');

const router = express.Router();

// router.use(authController.isLoggedIn); // applied to every single route // remember this route runs for for every request in the database also

router.use(viewsController.alerts); // runs for every request in this router // picks up d alert from the querystring, and put a alert message unto the response.locals

router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get(
    '/my-tours',
    // bookingController.createBookingCheckout,
    authController.protect,
    viewsController.getMyTours
);

// for the html update form
router.post('/submit-user-data', authController.protect, viewsController.updateUserData);

module.exports = router;
