const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../model/tourModel'); // tourModel
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

// we made the catchAsync function return another function to be assigned to create tour, so that function can be called when necessary

// NOTE: THIS IS A PARAM MIDDLEWARE FUNCTION.
// exports.checkID = (req, res, next, val) => {
//     console.log(`Tour id is: ${val}`);

//     if (req.params.id * 1 > tours.length) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Invalid ID',
//         });
//     }
//     // note: that the (return) cut the execution at the if statement
//     next();
// };

// Store files in memory(buffer)
const multerStorage = multer.memoryStorage();

// Test if d uploaded file is an image. To allow only images to be uploaded (true or false)
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

// multiple field with multiple files
exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 },
]);

// upload.array('images', 3); // req.files // one field with multiple files
// upload.single('images'); // req.file // one field one files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    // console.log(req.files); // "files" for multiple files

    // if there's no file on the request
    if (!req.files.imageCover || !req.files.images) return next();

    // 1) Cover images
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`; // update the imageCover filename on the req body

    await sharp(req.files.imageCover[0].buffer) // library for proessing images
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`);

    // 2) images
    req.body.images = [];

    // waits till all the images are processed
    await Promise.all(
        req.files.images.map(async (file, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

            await sharp(file.buffer) // library for processing images
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`);

            req.body.images.push(filename); // update the images array on the req body
        })
    );

    next();
});

exports.aliasTopTours = (req, res, next) => {
    // Here we manipulate the query object, prefilling before we get to the getAllTours handler.
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// Aggregation Pipeline (stages) // in this pipeline we used aggregation pipeline operators ($)
exports.getTourStats = catchAsync(async (req, res, next) => {
    // returns an aggregate object
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
            $group: {
                // _id: '$ratingsAverage', // we group all tours together by their "ratingsAverage"
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 }, // for each of d document we add 1
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
        {
            // we have to sort using the field names in the $group (we cant use d old names, the dont exist anymore in d pipeline)
            $sort: { avgPrice: 1 },
        },
        // {
        //     $match: { _id: { $ne: 'EASY' } }, // SELECTS all documents that are noot easy
        // },
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats,
        },
    });
});

exports.getMonthlyPlan = async (req, res, next) => {
    // NOTE: any $ in a string ('$startDates') means we are selecting a field
    const year = req.params.year * 1; // 2021

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numToursStarts: { $sum: 1 },
                tours: { $push: '$name' },
            },
        },
        {
            $addFields: { month: '$_id' },
        },
        {
            $project: { _id: 0 },
        },
        {
            $sort: { numToursStarts: -1 },
        },
        {
            $limit: 12,
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan,
        },
    });
};

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.134616, -118.146555/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    // mongodb expects the radius(distance) in a special unit called radians = radians: distance / radius of d earth
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitude and longitude in the format lat lng.',
                400
            )
        );
    }

    // console.log(distance, lat, lng, unit);
    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours,
        },
    });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001; // mi = miles else kilometers // 0.001 means multiply d distance by 1000 to "kilometers"

    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitude and longitude in the format lat lng.',
                400
            )
        );
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1], // convert string to num
                },
                distanceField: 'distance', // meters default
                distanceMultiplier: multiplier,
            },
        },
        {
            $project: {
                // only return this data from d doc
                distance: 1,
                name: 1,
            },
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances,
        },
    });
});

// exports.getAllTours = catchAsync(async (req, res, next) => {
//     // console.log(req.requestTime);

//     // const tours = await Tour.find(); // returns a promise // find() Returns all the doc in that collection in an array
//     // console.log(req.query);

//     // EXECUTE THE QUERY
//     const features = new APIFeatures(Tour.find(), req.query) // remember Tour.find creates a query
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate();

//     const tours = await features.query;
//     // query.sort().select().skip().limit()

//     // const query = Tour.find()  // Query
//     //     .where('duration')
//     //     .equals(5)
//     //     .where('difficulty')
//     //     .equals('easy');

//     // SEND RESPONSE
//     res.status(200).json({
//         status: 'success',
//         results: tours.length,
//         data: {
//             tours,
//         },
//     });
// });
