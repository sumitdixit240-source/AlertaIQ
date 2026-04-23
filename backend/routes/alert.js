const express = require("express");
const OTP = require("../models/OTP");
const sendMail = require("../services/mailer"); // FIXED

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Alert route working 🚀"
  });
});

router.post("/create", async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message required"
      });
    }

    res.json({
      success: true,
      message: "Alert created",
      data: { title, message }
    });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000);

    await OTP.create({ email, otp });

    // FIXED USAGE
    await sendMail(
      email,
      "Your OTP",
      `<h1>Your OTP is ${otp}</h1>`
    );

    res.json({ success: true, message: "OTP sent" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email, otp });

    if (!record) {
      return res.status(400).json({ success: false });
    }

    await OTP.deleteMany({ email });

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
