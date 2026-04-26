const express = require("express");
const router = express.Router();

const Alert = require("../models/Alert");
const OTP = require("../models/OTP");
const sendMail = require("../services/mailer");
const auth = require("../middleware/auth");


// ================= HEALTH =================
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
    const {
      title,
      category,
      amount,
      expiryDate,
      frequency
    } = req.body;

    // 🔐 VALIDATION
    if (!title || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "title and expiryDate required"
      });
    }

    const expiry = new Date(expiryDate);

    if (isNaN(expiry.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid expiry date"
      });
    }

    // 🔥 NEXT RUN LOGIC (CRON READY)
    const now = new Date();
    let nextRunAt = new Date(expiry);

    if (frequency === "daily") {
      nextRunAt.setDate(now.getDate() + 1);
    } else if (frequency === "weekly") {
      nextRunAt.setDate(now.getDate() + 7);
    } else if (frequency === "monthly") {
      nextRunAt.setMonth(now.getMonth() + 1);
    } else if (frequency === "yearly") {
      nextRunAt.setFullYear(now.getFullYear() + 1);
    }

    const alert = await Alert.create({
      userId: req.user.id,
      email: req.user.email,
      title: title.trim(),
      category: category || "General",
      amount: amount || 0,
      expiryDate: expiry,
      frequency: frequency || "one-time",
      lastSent: null,
      nextRunAt,
      status: "active",
      reminderSent: false
    });

    res.json({
      success: true,
      message: "Alert created successfully",
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


// ================= GET ALERTS =================
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


// ================= SEND OTP =================
router.post("/send-otp", auth, async (req, res) => {
  try {
    const email = req.user.email;

    await OTP.deleteMany({ userId: req.user.id });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 5 * 60 * 1000;

    await OTP.create({
      email,
      otp,
      userId: req.user.id,
      createdAt: new Date(),
      expiresAt
    });

    await sendMail(
      email,
      "AlertAIQ OTP Verification",
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


// ================= VERIFY OTP =================
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