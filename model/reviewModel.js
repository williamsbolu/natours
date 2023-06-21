const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review can not be empty!'],
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour.'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user.'],
        },
    },
    {
        // for d virtuals properties
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Makes sure one user cannot write multiple reviews for the same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // didn't work imediately (vid-170)

// QUERY MIDDLEWARE...
reviewSchema.pre(/^find/, function (next) {
    // added two extra queries, "more performance/running time"
    // this.populate({
    //     path: 'tour',
    //     select: 'name',
    // }).populate({
    //     path: 'user',
    //     select: 'name photo',
    // });

    this.populate({
        path: 'user',
        select: 'name photo',
    });

    next();
});

// Static methods // called on d Model
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    // "this" here points to the model
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }, // select the reviews based on the tour(id)
        },
        {
            $group: {
                _id: '$tour', // group  all tours by tour
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);

    // console.log(stats);

    if (stats.length > 0) {
        // save and update the current stats to the current tour
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating,
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5,
        });
    }
};

// POST
reviewSchema.post('save', function (doc, next) {
    // "this" points to current review being saved // this.constructor points to the model(Review)

    this.constructor.calcAverageRatings(this.tour);
    next();
});

// findByIdAndUpdate
// findByIdAndDelete

// Jonas Solution
// reviewSchema.pre(/^findOneAnd/, async function (next) {
//     // We passed data from a pre middleware to the post middleware by saving it to the this "query variable"
//     this.r = await this.findOne();
//     next();
// });

// reviewSchema.post(/^findOneAnd/, async function () {
//     // this.findOne(); does NOT work here. query has executed. "this" keyword here dosen't point to the current query
//     if (this.r) {
//         // if the passed data has its content then we caculate
//         await this.r.constructor.calcAverageRatings(this.r.tour);
//     }
// });

// My solution
reviewSchema.post(/^findOneAnd/, async function (doc, next) {
    if (doc) {
        // if we have a document
        await doc.constructor.calcAverageRatings(doc.tour);
    }

    next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;

// So we caculate the Rating statistics for when d tour is Saved, "updated" and "deleted"
// /^findOneAnd/: middleware that runs for all methods starting with findByIdAndUpdate, findByIdAndDelete, findOneAndDelete, findOneAndUpdate
