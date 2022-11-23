const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1.create a TRANSPORTER
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_AUTH_USER,
      pass: process.env.EMAIL_AUTH_PASSWORD
    }
  });

  // 2.Define the message configuration OPTIONS (or data)
  const message = {
    from: 'krish <natours.io>',
    to: options.email,
    subject: options.subject,
    text: options.message
    //   html: '<p>HTML version of the message</p>'
  };

  // 3.SEND the EMAIL
  await transporter.sendMail(message);
};

module.exports = sendEmail;
