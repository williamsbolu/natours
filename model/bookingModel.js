const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'booking must belong to a Tour!'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'booking must belong to a User!'],
    },
    price: {
        type: Number,
        required: [true, 'booking must have a price.'],
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    paid: {
        type: Boolean,
        default: true,
    },
});

// populate the tour and d user automatically whenever there is a query
bookingSchema.pre(/^find/, function (next) {
    this.populate('user').populate({ path: 'tour', select: 'name' });

    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
