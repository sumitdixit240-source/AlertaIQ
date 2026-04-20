const express = require("express");
const router = express.Router();

const OTP = require("../models/OTP");
const { sendEmailOTP } = require("../services/mailer");

// ✅ CUSTOM OTP (NO LIBRARY)
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* =========================
   SEND OTP
========================= */
router.post("/send", async (req, res) => {
  try {
    const { value } = req.body; // email

    if (!value) {
      return res.status(400).json({ error: "Email required" });
    }

    const otp = generateOTP();

    // delete old OTP
    await OTP.deleteMany({ value });

    // save new OTP
    await OTP.create({
      value,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 min
    });

    // send email
    await sendEmailOTP(value, otp);

    res.json({ success: true, message: "OTP sent to email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/* =========================
   VERIFY OTP
========================= */
router.post("/verify", async (req, res) => {
  try {
    const { value, otp } = req.body;

    const record = await OTP.findOne({ value });

    if (!record) {
      return res.status(400).json({ error: "OTP not found" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // delete after success
    await OTP.deleteMany({ value });

    res.json({ success: true, message: "OTP verified" });

  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;
