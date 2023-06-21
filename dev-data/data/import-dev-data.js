const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../model/tourModel');
const Review = require('../../model/reviewModel');
const User = require('../../model/userModel');

dotenv.config({
    path: './config.env',
});

// Gets the database connection string and replace the password
const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

// connect method returns a promise
mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
    })
    .then((con) => console.log('DB connection successful!'));

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
    fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// IMPORT DATA INTO DB
const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log('Data sucessfully loaded');
    } catch (err) {
        console.log(err);
    }
    process.exit(); // exits d node process in the command line
};

// DELETE ALL DATA FROM COLLECTION(DB)
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await Review.deleteMany();
        await User.deleteMany();
        console.log('Data sucessfully deleted');
    } catch (err) {
        console.log(err);
    }
    process.exit(); // exits d node process in the command line
};

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}

console.log(process.argv);

// we need he dotenv package becus we need the enviroment variables in order
// to be able to connect to the database. And we need to connect to the database
// in this script, because it runs completely independent from our express app
