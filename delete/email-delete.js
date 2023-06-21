const nodemailer = require('nodemailer');

// THIS IS HOW WE SEND THE EMAIL BY CALLING THE FUNCTION LIKE THIS
// await sendEmail({
//     email: user.email,
//     subject: 'Your password reset token (valid for 10 min)',
//     message: `Forgot your password?, Submit a PATCH request with your new password and passwordConfirm: to ${resetURL}
//                  \nIf you didn't forget your password please ignore this email!`,
// });

const sendEmail = async (options) => {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // 2. Define the email options
    const mailOptions = {
        from: 'Williams Bolu <hello@bolu.io>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html:
    };

    // 3. Actually send the email with nodemailer
    await transporter.sendMail(mailOptions); // promise
};

module.exports = sendEmail;

// const transporter = nodemailer.createTransport({
//     service: 'Gmail',
//     auth: {
//         user: process.env.EMAIL_USERNAME,
//         pass: process.env.EMAIL_PASSWORD,
//     },
//     // Activate in your Gmail account "less secure app" option
// });
