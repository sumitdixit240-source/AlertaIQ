const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const OTP = require("../models/OTP");
const sendMail = require("../services/mailer");
const generateOTP = require("../utils/generateOTP");

const auth = require("../middleware/auth");

const router = express.Router();

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    email = email.toLowerCase().trim();

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ msg: "User already exists" });
    }

    await User.create({
      name,
      email,
      password,
      isVerified: false,
      tokenVersion: 0,
    });

    res.json({ msg: "Registered successfully. Verify OTP." });

  } catch (err) {
    console.error("REGISTER:", err.message);
    res.status(500).json({ msg: "Registration failed" });
  }
});


// ================= SEND OTP (SECURE + RATE LIMIT FIX) =================
router.post("/send-otp", async (req, res) => {
  try {
    let { email } = req.body;

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // OTP cooldown (IMPORTANT FIX)
    const recent = await OTP.findOne({ email });
    if (recent && Date.now() - recent.createdAt.getTime() < 60 * 1000) {
      return res.status(429).json({ msg: "Wait 1 minute before retry" });
    }

    const otp = generateOTP();

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp,
      createdAt: new Date(),
    });

    await sendMail(email, "AlertAIQ OTP", `Your OTP is ${otp}`);

    res.json({ msg: "OTP sent" });

  } catch (err) {
    console.error("OTP ERROR:", err.message);
    res.status(500).json({ msg: "OTP failed" });
  }
});


// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
  try {
    let { email, otp } = req.body;

    email = email.toLowerCase().trim();

    const record = await OTP.findOne({ email });
    if (!record) return res.status(400).json({ msg: "OTP not found" });

    // expiration fix
    if (Date.now() - record.createdAt.getTime() > 5 * 60 * 1000) {
      await OTP.deleteMany({ email });
      return res.status(400).json({ msg: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    await User.updateOne({ email }, { isVerified: true });
    await OTP.deleteMany({ email });

    const user = await User.findOne({ email });

    // 🔐 FIXED JWT (tokenVersion ADDED)
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      msg: "Verified",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPro: user.isPro,
      },
    });

  } catch (err) {
    console.error("VERIFY OTP:", err.message);
    res.status(500).json({ msg: "Verification failed" });
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (!user.isVerified) {
      return res.status(403).json({ msg: "Verify OTP first" });
    }

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ msg: "Invalid password" });

    // 🔐 FIXED JWT (tokenVersion ADDED)
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPro: user.isPro,
      },
    });

  } catch (err) {
    console.error("LOGIN:", err.message);
    res.status(500).json({ msg: "Login failed" });
  }
});


// ================= ME =================
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch user" });
  }
});

module.exports = router;