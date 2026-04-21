const express = require("express");
const router = express.Router();

const otpStore = require("../utils/otpStore");
const generateOTP = require("../utils/generateOTP");
const transporter = require("../utils/mailer");

// ================= SEND OTP =================
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = generateOTP();

  // Use function (clean)
  otpStore.setOtp(email, otp);

  try {
    await transporter.sendMail({
      from: `"AlertAIQ" <${process.env.EMAIL}>`,
      to: email,
      subject: "Your OTP",
      text: `Your OTP is ${otp}`
    });

    console.log("✅ OTP SENT:", otp);

    res.json({ message: "OTP sent" });
  } catch (err) {
    console.log("❌ EMAIL ERROR:", err.message);
    res.status(500).json({ message: "Email failed" });
  }
});


// ================= VERIFY OTP =================
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const result = otpStore.verifyOtp(email, otp);

  if (!result.valid) {
    return res.status(400).json({ message: result.message });
  }

  res.json({ message: "OTP verified successfully" });
});

module.exports = router;
