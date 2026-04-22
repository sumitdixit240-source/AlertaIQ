const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const OTP = require("../models/OTP");
const sendMail = require("../services/mailer");
const generateOTP = require("../utils/generateOTP");

const router = express.Router();


// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("REGISTER HIT:", email);

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      isVerified: false
    });

    try {
      await sendMail(
        email,
        "AlertAIQ Account Created",
        `Hi ${name}, your account is created. Please verify OTP.`
      );
    } catch (mailErr) {
      console.error("MAIL ERROR (REGISTER):", mailErr.message);
    }

    res.json({ msg: "Account created", user });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});


// ================= SEND OTP =================
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("SEND OTP HIT:", email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    const otp = generateOTP();
    const createdAt = new Date();

    // remove old OTP
    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp,
      createdAt
    });

    console.log("OTP GENERATED:", otp);

    try {
      await sendMail(
        email,
        "AlertAIQ OTP Verification",
        `Your OTP is: ${otp} (valid 5 min)`
      );
    } catch (mailErr) {
      console.error("MAIL ERROR (OTP):", mailErr.message);
      return res.status(500).json({ msg: "Failed to send OTP email" });
    }

    res.json({ msg: "OTP sent successfully" });

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({
      msg: "OTP failed",
      error: err.message
    });
  }
});


// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log("VERIFY HIT:", email, otp);

    const record = await OTP.findOne({ email });

    if (!record) {
      return res.status(400).json({ msg: "OTP not found or expired" });
    }

    const now = new Date().getTime();
    const otpTime = new Date(record.createdAt).getTime();

    if (now - otpTime > 5 * 60 * 1000) {
      await OTP.deleteMany({ email });
      return res.status(400).json({ msg: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    await User.updateOne({ email }, { isVerified: true });
    await OTP.deleteMany({ email });

    const user = await User.findOne({ email });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      msg: "OTP verified",
      token,
      user: {
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN HIT:", email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ msg: "Verify OTP first" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ msg: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
