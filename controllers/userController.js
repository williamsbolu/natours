const multer = require('multer'); // for uploading images
const sharp = require('sharp'); // image processing library (resizing images)
const User = require('../model/userModel'); // userModel
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// cb(null) means there is no error.

// A complete defination of how we want to store our files (destination, filename)
// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         // user-7676768agtra(id)-timestamp.jpg
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     },
// });

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

exports.uploadUserPhoto = upload.single('photo'); // field name "photo"

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    // if there's no file on the request
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer) // library for proessing images
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
});

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};

    Object.keys(obj).forEach((el) => {
        // if the current fields is one of the allowed fields
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });

    return newObj;
};

// User api functions
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id; // adds d user id gotten fro d "protect" to the parameter
    next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
    // console.log(req.file); //for d multer middleware
    // console.log(req.body.name); //for d multer middleware

    // 1. Create error if user tries to update the password
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates, please use /updateMyPassword',
                401
            )
        );
    }

    // 2. Filtered out unwanted fields names that are not allowed to be updated.
    const fliteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) fliteredBody.photo = req.file.filename; // Runs if we're updating the photo and adds a photo property to be updated

    // 3. Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, fliteredBody, {
        new: true,
        runValidators: true,
    }); // passed in options

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined! Please use /signup instead',
    });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// do NOT update the password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

// Remember the updateUser is only for administrators, And only for updating data that is not the password
// before the .find() query is executed, we want to add something to it, which is that we only want to find document which have the active property set to "true"
// And we do this using the query middleware
