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
    const { name, email, password } = req.body;

    // validation
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // check existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // create user
    const user = new User({
      name,
      email,
      password,
      isVerified: false,
      isPro: false,
      tokenVersion: 0
    });

    await user.save();

    // send welcome mail (non-blocking)
    try {
      await sendMail(
        email,
        "RenewAI Account Created",
        `Hi ${name}, your account is created. Please verify OTP.`
      );
    } catch (mailErr) {
      console.error("MAIL ERROR:", mailErr.message);
    }

    res.json({ msg: "User registered successfully" });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.status(500).json({ msg: "Registration failed" });
  }
});


// ================= SEND OTP =================
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    const otp = generateOTP();

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp,
      createdAt: new Date()
    });

    try {
      await sendMail(
        email,
        "RenewAI OTP Verification",
        `Your OTP is ${otp}. Valid for 5 minutes.`
      );
    } catch (mailErr) {
      console.error("MAIL ERROR:", mailErr.message);
    }

    res.json({ msg: "OTP sent successfully" });

  } catch (err) {
    console.error("SEND OTP ERROR:", err.message);
    res.status(500).json({ msg: "Failed to send OTP" });
  }
});


// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ msg: "Email & OTP required" });
    }

    const record = await OTP.findOne({ email });
    if (!record) {
      return res.status(400).json({ msg: "OTP not found" });
    }

    const isExpired =
      Date.now() - record.createdAt.getTime() > 5 * 60 * 1000;

    if (isExpired) {
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
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role || "user",
        tokenVersion: user.tokenVersion || 0
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      msg: "OTP verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPro: user.isPro
      }
    });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err.message);
    res.status(500).json({ msg: "OTP verification failed" });
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email & password required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ msg: "Verify OTP first" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Wrong password" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role || "user",
        tokenVersion: user.tokenVersion || 0
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
        isPro: user.isPro
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(500).json({ msg: "Login failed" });
  }
});


// ================= GET CURRENT USER =================
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);

  } catch (err) {
    console.error("ME ERROR:", err.message);
    res.status(500).json({ msg: "Failed to fetch user" });
  }
});

module.exports = router;