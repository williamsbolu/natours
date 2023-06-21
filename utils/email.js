const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
// const { htmlToText } = require('html-to-text'); // another way

// new Email(user, url).sendWelcome() // This is how we'll later send the email in our projects

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Williams Bolu ${process.env.EMAIL_FROM}`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD,
                },
            });
        }

        //  Create a transporter
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    // Send the actual email
    async send(template, subject) {
        // 1) Render HTLM based on the pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject,
        });

        // 2. Define the email options
        const mailOptions = {
            // from: this.from, // dev
            from:
                process.env.NODE_ENV === 'production'
                    ? `Natours ${process.env.SENDGRID_EMAIL_FROM}`
                    : this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.convert(html),
        };

        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions); // promise
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family');
    }

    async sendPasswordReset() {
        await this.send(
            'passwordReset',
            'Your password reset token (valid for only 10 minutes)'
        );
    }
};
