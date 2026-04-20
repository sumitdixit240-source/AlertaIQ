const express = require("express");
const router = express.Router();
const otpGenerator = require("otp-generator");

const OTP = require("../models/OTP");
const { sendEmailOTP } = require("../services/mailer");
const { sendSMSOTP, sendWhatsAppOTP } = require("../services/twilio");

/* =========================
   SEND OTP
========================= */
router.post("/send", async (req, res) => {
  const { type, value } = req.body;

  const otp = otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false
  });

  try {
    // SEND OTP
    if (type === "email") {
      await sendEmailOTP(value, otp);
    } else if (type === "phone") {
      await sendSMSOTP(value, otp);
    } else if (type === "whatsapp") {
      await sendWhatsAppOTP(value, otp);
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    // SAVE IN DB (5 min expiry)
    await OTP.create({
      value,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    res.json({ success: true, message: "OTP sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/* =========================
   VERIFY OTP
========================= */
router.post("/verify", async (req, res) => {
  const { value, otp } = req.body;

  try {
    const record = await OTP.findOne({ value, otp });

    if (!record) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // DELETE AFTER VERIFY
    await OTP.deleteMany({ value });

    res.json({ success: true, message: "OTP verified" });

  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;