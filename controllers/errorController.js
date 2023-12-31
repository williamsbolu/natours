const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;

    // return an error object with d Operational error property
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    // const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];  // Jonas solution

    // my solution: Object.values() returns an array
    const value = Object.values(err.keyValue)[0];
    // console.log(value);

    const message = `Duplicate field value: ${value}. Please use another value`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    // console.log(errors);

    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid Token. Please log in again!', 401);

const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
    //  A) API
    if (req.originalUrl.startsWith('/api')) {
        // send d error as json
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }

    // B) RENDER ERROR WEBPAGE
    console.error('Error 💥', err);

    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message,
    });
};

const sendErrorProd = (err, req, res) => {
    // A) API: runs for the api
    if (req.originalUrl.startsWith('/api')) {
        // Operational, trusted error: send this message to d client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }

        // programming or other unknown errors: dont leak error details to client
        console.error('Error 💥', err);

        // send generic message
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
        });
    }

    // B) RENDER ERROR WEBPAGE: runs for the webpage
    // i) Operational, trusted error: send this message to d client
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message,
        });
    }

    // ii) programming or other unknown errors: dont leak error details to client
    console.error('Error 💥', err);

    // send generic message
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later.',
    });
};

module.exports = (err, req, res, next) => {
    // console.log(err.stack); // traces where d error originated
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        // console.log(err);
        // in this block i was meant to clone the err object like d example below, but since im not using the err object elsewhere there no need for that
        // let error = { ...err };
        // error.name = err.name;
        // console.log(error);

        // CastError: error gotten from invalid id in mongoose (Get Tour)
        if (err.name === 'CastError') err = handleCastErrorDB(err);

        // Mongoose duplicate key/fields (Create Tour)
        if (err.code === 11000) err = handleDuplicateFieldsDB(err);

        // Mongoose validation error (update tour)
        if (err.name === 'ValidationError') err = handleValidationErrorDB(err);

        // json web token error "jwt.verify()": Invalid Token
        if (err.name === 'JsonWebTokenError') err = handleJWTError();

        // json web token error "jwt.verify()": Expired Token
        if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();

        sendErrorProd(err, req, res);
    }
};

// Note: we are not getting the error statuscode from the express middleware functions (the tourControllers) when there is an error
// from mongose (will be fixed later in the section😅)

// the two most frequent ways errors are generated in our app is either from mongoose
// or from our AppError class

// 3 types of Error which might be created from mongoose: CastError, MongoError, ValidationError

// the goal of handleCastErrorDB, handleDuplicateFieldsDB and handleValidationErrorDB is to format our errors (generated by mongoDB or mongoose routers) and mark them as Operational so that in
// the production enviroment we can send them for the client to see

// Object.values returns an array of d object (values)
