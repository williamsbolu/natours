const crypto = require('crypto'); // used in our code for generating random number string
const mongoose = require('mongoose');
const validator = require('validator'); // custom validators (third party)
const brypt = require('bcryptjs'); // for password hashing

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: {
        type: String,
        default: 'default.jpg', // default image for a user
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function (el) {
                // "This" only works on CREATE and SAVE!!!
                // if passwordConfirm === password
                return el === this.password;
            },
            message: 'Passwords are not the same!',
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

// Document Middleware // "this" refers to d current document
userSchema.pre('save', async function (next) {
    // if d "password" field has "not" been updated/modified: by default using Create, and updating/changing the password: isModified is truthy
    if (!this.isModified('password')) return next();

    // Encrypt d password: hash with a cost of 12
    // this.password = await brypt.hash(this.password, 12); // Async: returns a promise

    // Delete the passwordConfirm field
    this.passwordConfirm = undefined;

    next();
});

userSchema.pre('save', function (next) {
    // if d "password" field has "not" been modified or if the document/field is new
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000; // because saving to the db is a bit slower than issueing the token, we set the passwordChangedAt to 1 seconds before d current time to ensure that it is created before the token

    next();
});

// Query Middleware
userSchema.pre(/^find/, function (next) {
    // this points to the current query
    this.find({ active: { $ne: false } });
    next();
});

// Instance Method: "this" points to current document
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    // this.password: is not available due to d "select: false "field

    // returns "true" if d password are d same if not "false"
    return await brypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10); // return timestamp in "seconds" not "milliseconds"

        // console.log(changedTimeStamp, JWTTimestamp);
        return JWTTimestamp < changedTimeStamp; // True means changed
    }

    // by default returns false means d user has not changed his password after d token was issued
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    // By using "this" here in instance method, we did not save to the db, we "modify" the user document with the updated data
    // so later we "Save" the encrypted token "passwordResetToken" and "passwordResetExpires" to the db so we can compare with the token the user provides
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex'); // encrypt the token

    // console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // current date + 10 minutes

    return resetToken; // return the plain token
};

const User = mongoose.model('User', userSchema);

module.exports = User;

// User schema allows us to get started with creating users
// from d validator funct, we returm either true or false. if false, we get a validation error

// Our code logic is that: we only want to enrypt the password if the password field has atually been updated.
// we really only need the passwordConfirm for validation

// instance method: method available on all documents of a certain collection (user documents)
// documents are instance of a model

// JWTTimestamp(date the token was issued) < changedTimeStamp(date the password was changed)
// eg 100 < 200 = true (changed), 300 < 200 = false (not changed)
