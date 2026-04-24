const express = require("express");
const router = express.Router();

const Alert = require("../models/Alert");
const OTP = require("../models/OTP");
const sendMail = require("../services/mailer");
const auth = require("../middleware/auth");


// ================= HEALTH CHECK =================
router.get("/", auth, (req, res) => {
  res.json({
    success: true,
    message: "Alert system active 🚀",
    user: req.user.id
  });
});


// ================= CREATE ALERT =================
router.post(["/create", "/add"], auth, async (req, res) => {
  try {
    const { title, message, description } = req.body;

    if (!title && !message && !description) {
      return res.status(400).json({
        success: false,
        message: "Title or message required"
      });
    }

    const alert = await Alert.create({
      userId: req.user.id,
      title: title || "No Title",
      message: message || description || ""
    });

    res.json({
      success: true,
      message: "Alert created",
      data: alert
    });

  } catch (err) {
    console.error("CREATE ALERT ERROR:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to create alert"
    });
  }
});


// ================= GET USER ALERTS =================
router.get(["/my", "/list"], auth, async (req, res) => {
  try {
    const alerts = await Alert.find({
      userId: req.user.id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: alerts
    });

  } catch (err) {
    console.error("GET ALERTS ERROR:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch alerts"
    });
  }
});


// ================= SEND OTP (SECURE VERSION) =================
router.post("/send-otp", auth, async (req, res) => {
  try {
    const email = req.user.email;

    // 🔥 Prevent OTP spam (delete old first)
    await OTP.deleteMany({ userId: req.user.id });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min

    await OTP.create({
      email,
      otp,
      userId: req.user.id,
      createdAt: new Date(),
      expiresAt
    });

    await sendMail(
      email,
      "RenewAI OTP Verification",
      `<h2>Your OTP is: ${otp}</h2><p>Valid for 5 minutes</p>`
    );

    res.json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (err) {
    console.error("SEND OTP ERROR:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to send OTP"
    });
  }
});


// ================= VERIFY OTP (SECURE VERSION) =================
router.post("/verify-otp", auth, async (req, res) => {
  try {
    const { otp } = req.body;

    const record = await OTP.findOne({
      userId: req.user.id,
      otp: Number(otp)
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // ⛔ expiry check
    if (record.expiresAt && Date.now() > record.expiresAt) {
      await OTP.deleteMany({ userId: req.user.id });
      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    await OTP.deleteMany({ userId: req.user.id });

    res.json({
      success: true,
      message: "OTP verified successfully"
    });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err.message);
    res.status(500).json({
      success: false,
      error: "OTP verification failed"
    });
  }
});

module.exports = router;