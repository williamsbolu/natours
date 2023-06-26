const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../model/tourModel');
const User = require('../model/userModel');
const Booking = require('../model/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1. Get the currently booked tour
    const tour = await Tour.findById(req.params.tourID);

    // 2. Create checkout session
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
        //     req.params.tourID
        // }&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get('host')}/my-tours`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourID,
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'usd',
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: `${tour.summary}`,
                        images: [
                            `${req.protocol}://${req.get('host')}/${tour.imageCover}`,
                        ],
                    },
                },
            },
        ],
    });

    // 3. Create session as response
    res.status(200).json({
        status: 'success',
        session,
    });
});
// the createBookingCheckout() controller function runs when we create a booking after purchase
// success_url:  whenever a "checkout" is successful, the browser will automatically go to this url

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     // This is only TEMPORARY, because its UNSECURE: everyone can make bookings without paying
//     const { tour, user, price } = req.query; // Query string

//     if (!tour && !user && !price) return next(); // return

//     await Booking.create({ tour, user, price });

//     // redirect: Creates a new request to the url passed in // we remove d query string from d url with split('?)
//     res.redirect(req.originalUrl.split('?')[0]);
// });

// req.originalUrl returns the current url of the host
// ${req.protocol}://${req.get('host')} returns the hosting service of the "web-api/server"

const createBookingCheckout = async (session) => {
    // console.log(session);
    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_email })).id;
    const price = session.amount_total / 100;
    await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
    // This function runs whenever a payment is successful
    const signature = req.headers['stripe-signature'];

    let event;

    try {
        // req.body here is in the raw form
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        return res.status(400).send(`webhook error: ${error.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        createBookingCheckout(event.data.object); // if d event is correct we den call createBookingCheckout() with d "session" as parameter
    }

    // send response to stripe
    res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
