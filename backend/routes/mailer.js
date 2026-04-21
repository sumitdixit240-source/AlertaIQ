const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmailOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"AlertAIQ" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP - AlertAIQ",
    html: `<h2>Your OTP is: ${otp}</h2><p>Valid for 5 minutes</p>`
  });
};

module.exports = { sendEmailOTP };
