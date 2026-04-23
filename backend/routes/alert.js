const express = require("express");
const OTP = require("../models/OTP");
const sendEmailOTP = require("../services/mailer").sendEmailOTP;

const router = express.Router();


// ================= TEST ROUTE =================
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Alert route working 🚀"
  });
});


// ================= CREATE ALERT =================
router.post("/create", async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required"
      });
    }

    res.json({
      success: true,
      message: "Alert created successfully",
      data: { title, message }
    });

  } catch (error) {
    console.error("Alert Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create alert"
    });
  }
});


// ================= SEND OTP =================
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    await OTP.create({ email, otp });

    await sendEmailOTP(email, otp);

    res.json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (error) {
    console.log("OTP ERROR:", error);
    res.status(500).json({
      success: false,
      message: "OTP failed"
    });
  }
});


// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email, otp });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    await OTP.deleteMany({ email });

    res.json({
      success: true,
      message: "OTP verified successfully"
    });

  } catch (error) {
    console.log("VERIFY ERROR:", error);
    res.status(500).json({
      success: false,
      message: "OTP verification failed"
    });
  }
});

module.exports = router;