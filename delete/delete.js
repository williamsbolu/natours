// const createSendToken = (user, statusCode, res) => {
//     // Create our Token // jwt.sign(payload, secret, options)
//     const token = signToken(user._id);

//     res.status(statusCode).json({
//         status: 'success',
//         token,
//         data: {
//             user,
//         },
//     });
// };

// exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if (!tour) {
//         // if null: there's no tour // This logic is for handlers querying documents based on id
//         return next(new AppError('No tour found with that ID', 404));
//     }

//     // when we have d delete request the response is usually a 204 meaning (no content)
//     res.status(204).json({
//         status: 'success',
//         data: null,
//     });
// });
