const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router(); // create a new router // its also a middleware

router.get('/getLoggedInStatus', authController.isLoggedInApi);

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resePatssword/:token', authController.resetPassword);

// -- This basially Protects all d routes that comes after this middleware "line 👇" -- Remmeber middleware functions runs in sequence "order of their arrangement" -- //
router.use(authController.protect);

// All this middleware below now are protected by "router.use(authController.protect)"
router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
    '/updateMe',
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

// restricts all the routes below to be accessed by only an "admin" after this middleware function
router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers).post(userController.createUser);
router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;

// Remember authController.protect puts the current user object on the request object, and it will only call the next middleware if d user is authenticated
// And also remember all the router methods we used eg: router.use, router.get,post,patch,etc are all middleware functions
