const Tour = require('../model/tourModel');
const User = require('../model/userModel');
const Booking = require('../model/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
    // 1) Get tour data from collection
    const tours = await Tour.find();

    // 2) Build template by passing the tour data into them

    // 3) Render that template using the tour data from step 1
    res.status(200).render('overview', {
        title: 'All Tours',
        tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // 1) Get the data, for the requested tour (including reviews and guide)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user', // only return this fields in the "review" documents populated
    });

    if (!tour) {
        return next(new AppError('There is no tour with that name.', 404));
    }

    // 2) Build template

    // 3) Render template using data from step 1

    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour,
    });
});

exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account',
    });
};

exports.getAccount = (req, res) => {
    // we dont need to query for the current user here, because that has already been done by the protect middleware

    res.status(200).render('account', {
        title: 'Your account',
    });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    // 1. Find all bookings
    const bookings = await Booking.find({ user: req.user.id });

    // 2. Find tours with the returned ids

    // Get the tour id from the bookings doc
    const tourIDs = bookings.map((el) => el.tour);

    const tours = await Tour.find({ _id: { $in: tourIDs } }); // The $in operator selects the documents where the value of the id equals any value in the tourIDs array $in (mongoDb operator)

    res.status(200).render('overview', {
        title: 'My Tours',
        tours,
    });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
    // console.log('UPDATING USER...', req.body);

    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser,
    });
});
