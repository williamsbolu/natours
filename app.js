const path = require('path');
const morgan = require('morgan');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug'); // Tells express the template engine were using
app.set('views', path.join(__dirname, 'views')); // define the views "pug" folder

// (1) GLOBALS MIDDLEWARES
// Serving static files // accessing files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
// app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' })); // because of mapbox

// Development logging
if (process.env.NODE_ENV === 'development') {
    // console.log(process.env.NODE_ENV); // default (development)
    // if were in development mode
    app.use(morgan('dev'));
}

// Limit request from same APIs // this limiter is a middleware function
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000, // 1hr in milliseconds
    message: 'Too many request from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body Parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // parses data from an html form
app.use(cookieParser()); // parses data from cookies

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against xss
app.use(xss());

// Prevent parameter pollution
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price',
        ],
    })
);

// Test Middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log('Hello from the middleware 😁');
    // console.log(req.headers); //get the req headers
    // console.log(req.cookies);
    next();
});

// (3) ROUTES handlers  // here we mount our routers
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); // all the Routers are middleware functions
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// (4) unhandled routes : route not catched by any of our route handlers (eg tourRouter)
// all runs for all http methods(get, post) and routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// (5) Error Handling middleware: middleware only called when there is an error (accepts 4 parameters)
app.use(globalErrorHandler);

module.exports = app; // export our application

// middleware functions are executed in order
// whenever we pass anything into next(argument) express assumes it to be an error and skip all the other middleware in the stack and send the error that we passed to our global error handling middleware
