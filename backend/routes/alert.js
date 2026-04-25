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
  "AlertAIQ OTP Verification",
  `
  <div style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
    
    <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#4F46E5,#6366F1);padding:20px;text-align:center;color:#fff;">
        <h1 style="margin:0;font-size:22px;">AlertAIQ</h1>
        <p style="margin:5px 0 0;font-size:13px;opacity:0.9;">Smart Alerts & Notifications</p>
      </div>

      <!-- Body -->
      <div style="padding:25px;color:#333;">
        
        <h2 style="margin-top:0;font-size:18px;">OTP Verification</h2>

        <p style="font-size:14px;line-height:1.6;">
          Your AlertAIQ OTP is shown below. Use this One-Time Password to securely complete your verification. 
          This code ensures your account remains protected and accessible only to you. 
          Please enter it promptly before it expires.
        </p>

        <!-- OTP Box -->
        <div style="margin:25px 0;text-align:center;">
          <span style="display:inline-block;padding:14px 28px;font-size:26px;letter-spacing:4px;font-weight:bold;background:#eef2ff;color:#4F46E5;border-radius:8px;">
            ${otp}
          </span>
        </div>

        <!-- Points -->
        <ul style="padding-left:18px;font-size:14px;line-height:1.6;">
          <li>Valid for 5 minutes only</li>
          <li>Never share this OTP with anyone</li>
          <li>Ignore this email if not requested</li>
        </ul>

      </div>

      <!-- Footer -->
      <div style="background:#f9fafc;padding:15px;text-align:center;font-size:12px;color:#888;">
        © AlertAIQ — Secure Notification Platform  
      </div>

    </div>

  </div>
  `
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
