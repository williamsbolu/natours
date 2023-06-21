const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator'); // custom validators (third party)

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxlength: [40, 'A tour name must have less or equal than 40 characters'],
            minlength: [10, 'A tour name must have more or equal than 10 characters'],
            // validate: [validator.isAlpha, 'Tour name must only contain characters',], // third party vaildator
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size'],
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either: easy, medium or diffiult',
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
            set: (val) => Math.round(val * 10) / 10, // 4.666666, 4.7
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price'],
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    // "this" only points to the current doc on NEW document creation
                    // (val) value inputted // validate if the price discount is < than d price // this points to d current document
                    return val < this.price;
                },
                message: 'Discount price ({VALUE}) should be below the regular price',
            },
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'A tour must have a summary'],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover image'],
        },
        images: [String], // an array of string
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false, // permanently hides this field fro the output
        },
        startDates: [Date], // an array of Dates
        secretTour: {
            type: Boolean,
            default: false,
        },
        startLocation: {
            // GeoJSON data format
            type: {
                type: String,
                default: 'Point', // geometry
                enum: ['Point'],
            },
            coordinates: [Number], // lat, lon
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        // guides: Array, // for embedded example
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        // for d virtuals properties
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes // 1 accending: -1 decending
// tourSchema.index({ price: 1 }); // single field index
tourSchema.index({ price: 1, ratingsAverage: -1 }); // compound index
tourSchema.index({ slug: 1 });

tourSchema.index({ startLocation: '2dsphere' }); // Geospatial data "vid 171" 17:30

// Virtual Properties  // caculating the duration in weeks
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// virtual populate //
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour', // Review model
    localField: '_id', // Tour model
});

// DOCUMENT MIDDLEWARE:
// runs before an actual document is saved to d database (runs for the .save() and .create() mongoose mmethod)
tourSchema.pre('save', function (next) {
    // console.log(this); // this points to d current processed document (saved)

    this.slug = slugify(this.name, { lower: true }); // a new property
    next();
});

// tourSchema.pre('save', async function (next) {  // this code is responsible for performing "embedding" tour-guide users into tours
//     // guides is d array of d user id's
//     const guidesPromises = this.guides.map((id) => User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

// tourSchema.pre('save', function (next) {
//     console.log('will save document...');
//     next();
// });

// tourSchema.post('save', function (doc, next) {
//     // access to d document that was just saved to d database (doc)
//     console.log(doc);
//     next();
// });

// QUERY MIDDLEWARE...
// tourSchema.pre('find', function (next) { runs for the .find()
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } }); // this is a query object
    this.start = Date.now(); // setting a property to the this object (query)
    next();
});

tourSchema.pre(/^find/, function (next) {
    // All of d queries will automatically populate the guides field with d referenced user
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt',
    });
    // populate('') fill up d reference with d actual data(only in d query(res), not in d database)
    next();
});

tourSchema.post(/^find/, function (docs, next) {
    // docs: access to the documents returned from d query, We no longer have access to the "this" keyword here
    console.log(`Query took ${Date.now() - this.start} milliseconds`); // current-time - start-time
    // console.log(docs);

    next();
});

// AGGREGATION MIDDLEWARE:
// tourSchema.pre('aggregate', function (next) {
//     // this.pipeline() returns an array with d aggregation object
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//     console.log(this.pipeline()); // "this" is d the aggregation object,
//     next();
// });
// tourSchema.post('aggregate') // not necessary

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

// tourSchema.pre('save'): hook is d 'save', 'find' string

// /^find/ (regular expression) runs for all d mongoose method that starts with (find)

// Date.now() gives a tie stamp in milliseconds which in mongo is immediately
// converted to the date

// All the properties we use for validating in the schema are called (VALIDATORS)
// or schema type options

// in d mongoose.Schema(), we pass in an object for d schema definations first and
// and the second object for the schema options

// "guidesPromises"
// The .map function won't wait until the Promises are resolved which is why we need to use Promise.all(). After we map over the Promises, they're all pending and then Promise.all() will wait until they've all successfully resolved before it itself resolves.

// we want tours and users to always a completely seperate entities in our database
