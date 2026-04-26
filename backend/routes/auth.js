const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const OTP = require("../models/OTP");
const sendMail = require("../services/mailer");
const generateOTP = require("../utils/generateOTP");
const auth = require("../middleware/auth");

const router = express.Router();


// ================= TOKEN =================
const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};


// ================= AUTH RESPONSE =================
const sendAuthResponse = (user, res, message = "Success") => {
  const token = createToken(user);

  return res.json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    }
  });
};


// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    email = email.toLowerCase().trim();

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "User already exists"
      });
    }

    await User.create({
      name,
      email,
      password,
      role: "user",
      isVerified: false,
      tokenVersion: 0
    });

    return res.json({
      success: true,
      message: "Registered successfully"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
});


// ================= SEND OTP =================
router.post("/send-otp", async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required"
      });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const otp = generateOTP();

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp,
      createdAt: new Date(),
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    await sendMail(
      email,
      "AlertAIQ OTP Verification",
      `
      <div style="font-family:Arial;padding:20px">
        <h2>🔐 AlertAIQ Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes</p>
      </div>
      `
    );

    return res.json({
      success: true,
      message: "OTP sent"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "OTP failed"
    });
  }
});


// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
  try {
    let { email, otp } = req.body;

    email = email.toLowerCase().trim();

    const record = await OTP.findOne({ email });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP not found"
      });
    }

    if (record.otp != otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (record.expiresAt && Date.now() > record.expiresAt) {
      await OTP.deleteMany({ email });
      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    await User.updateOne({ email }, { isVerified: true });
    await OTP.deleteMany({ email });

    const user = await User.findOne({ email });

    return sendAuthResponse(user, res, "OTP verified");

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Verification failed"
    });
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Verify OTP first"
      });
    }

    const ok = await user.comparePassword(password);

    if (!ok) {
      return res.status(400).json({
        success: false,
        message: "Invalid password"
      });
    }

    return sendAuthResponse(user, res, "Login successful");

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});


// ================= ME =================
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    return res.json({
      success: true,
      user
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user"
    });
  }
});

module.exports = router;