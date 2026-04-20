const express = require("express");
const router = express.Router();
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");

const OTP = require("../models/OTP");
const User = require("../models/User");
const { sendEmailOTP } = require("../services/mailer");

/* =========================
   SEND OTP
========================= */
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const otp = otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false
  });

  try {
    await sendEmailOTP(email, otp);

    await OTP.deleteMany({ value: email }); // remove old OTPs

    await OTP.create({
      value: email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    res.json({ success: true, message: "OTP sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

/* =========================
   VERIFY OTP
========================= */
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const record = await OTP.findOne({ value: email, otp });

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
    }

    await OTP.deleteMany({ value: email });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
});

module.exports = router;