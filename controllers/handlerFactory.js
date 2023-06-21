const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            // if null: there's no tour // This logic is for handlers querying documents based on id
            return next(new AppError('No document found with that ID', 404));
        }

        // when we have d delete request the response is usually a 204 meaning (no content)
        res.status(204).json({
            status: 'success',
            data: null,
        });
    });

exports.updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!doc) {
            // if null: there's no document // This logic is for handlers querying documents based on id
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

exports.createOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.create(req.body); // saves d document in d database & returns d newly creatd document with d id

        res.status(201).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        // console.log(req.params);
        let query = Model.findById(req.params.id); // here we do not await the query, but just save it to a variable so we can manipulate it, then it would be awaited later
        if (popOptions) query = query.populate(popOptions);

        const doc = await query;
        // doc.findOne({ _id: req.params.id })

        if (!doc) {
            // if null: there's no document // This logic is for handlers querying documents based on id
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

exports.getAll = (Model) =>
    catchAsync(async (req, res, next) => {
        // To allow for nested route "GET reviews on tour" (hack)
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId }; // only the reviews in which the tour matches the params id will be found "or else get all the reiews"

        // EXECUTE THE QUERY
        const features = new APIFeatures(Model.find(filter), req.query) // remember Tour.find creates a query
            .filter()
            .sort()
            .limitFields()
            .paginate();

        // const doc = await features.query.explain();  // access to the request and query execution statistics
        const doc = await features.query;

        // SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: {
                data: doc,
            },
        });
    });
