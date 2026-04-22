const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password only
  },
});

// verify connection
transporter.verify()
  .then(() => console.log("✅ Mailer ready"))
  .catch(err => console.log("❌ Mailer error:", err));

const sendEmailOTP = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"AlertAIQ" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <div style="font-family:Arial;padding:10px">
          <h2>OTP Verification</h2>
          <h1 style="color:#4f46e5;letter-spacing:5px">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
    });

    console.log("📩 OTP sent:", info.messageId);
    return true;
  } catch (err) {
    console.log("❌ OTP email failed:", err);
    return false;
  }
};

module.exports = { sendEmailOTP };
