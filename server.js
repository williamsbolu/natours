const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Handling uncaught Exceptions for our (synchronous) code: must be at d top
process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);

    process.exit(1); // terminate/exit d serer
});

dotenv.config({
    path: './config.env',
});
const app = require('./app'); // our express application

// Gets the database connection string and replace the password
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// connect method returns a promise
mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
    })
    .then((con) => console.log('DB connection successful!'));
// .catch((err) => console.log('Error')); // for unhandled rejected promise

// console.log(app.get('env')); // Gets d enviroment were running in
// console.log(process.env); // gets the enviroment variables

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port${port}...`);
});

// Handling Unhandled Rejections (promise) for (async) code
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);

    // finishes all current and pending request and close
    server.close(() => {
        process.exit(1); // terminate/exit d serer
    });
});

process.on('SIGTERM', () => {
    console.log('✋ SIGTERM RECEIVED. Shutting down gracefully');

    // finishes all current and pending request and close
    server.close(() => {
        console.log('💥 Process terminated!');
    });

    // process.exit(1) // we dont need this cuz SIGTERM automatically cause d application to shut down
});

// dotenv is to add our variables to out enviroment variables What the dotenv config does is to read the variables from the file ('./config.env')
// and save them into nodejs enviroment variables
