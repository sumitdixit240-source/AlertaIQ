const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const auth = require("../middleware/auth");
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

    // ✅ password is hashed by schema (NO bcrypt here)
    const user = await User.create({
      name,
      email,
      password,
      isVerified: false
    });

    await sendMail(
      email,
      "AlertAIQ Account Created",
      `Hi ${name}, your account is created. Please verify OTP.`
    ).catch(err => console.error("MAIL ERROR:", err.message));

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
    if (!user) return res.status(400).json({ msg: "User not found" });

    const otp = generateOTP();

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp,
      createdAt: new Date()
    });

    console.log("OTP GENERATED:", otp);

    await sendMail(
      email,
      "AlertAIQ Login OTP",
      `Your OTP is ${otp}, valid for 5 minutes. Do not share it.`
    ).catch(err => console.error("MAIL ERROR:", err.message));

    res.json({ msg: "OTP sent successfully" });

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ msg: err.message });
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

    const isExpired = Date.now() - record.createdAt.getTime() > 5 * 60 * 1000;

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

    // 🔥 required because password is select:false in schema
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


// ================= GET CURRENT USER =================
const auth = require("../middleware/authMiddleware");

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


module.exports = router;
