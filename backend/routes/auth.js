const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const OTP = require("../models/OTP");

const sendMail = require("../services/mailer");
const generateOTP = require("../utils/generateOTP");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

//
// ================= RESPONSE HELPERS =================
//
const success = (res, message, data = {}) => {
  return res.status(200).json({
    success: true,
    message,
    ...data,
  });
};

const error = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

//
// ================= TOKEN =================
//
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

//
// ================= AUTH RESPONSE =================
//
const sendAuthResponse = (user, res, message) => {
  const token = createToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
  });

  return success(res, message, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

//
// ================= ACCOUNT WELCOME EMAIL =================
//
const buildAccountEmail = (name, email) => {
  return `
  <div style="font-family:Arial; padding:20px; color:#222; line-height:1.6">

    <h2>🎉 Welcome to AlertAIQ</h2>

    <p>Dear ${name},</p>

    <p>
      Your account has been successfully created on AlertAIQ, an intelligent AI-powered platform designed for digital security, monitoring, and automation.
    </p>

    <h3>📌 Account Details:</h3>
    <ul>
      <li><b>Name:</b> ${name}</li>
      <li><b>Email:</b> ${email}</li>
    </ul>

    <h3>🔐 Security Guidelines (5 Points)</h3>
    <ul>
      <li>Never share your password or OTP with anyone</li>
      <li>AlertAIQ never asks for credentials via call or email</li>
      <li>Use a strong and unique password</li>
      <li>Always logout from shared devices</li>
      <li>Monitor account activity regularly</li>
    </ul>

    <h3>🛡️ Platform Security</h3>
    <p>
      AlertAIQ uses advanced encryption, AI-based monitoring, and secure authentication systems to protect your digital identity and financial data.
    </p>

    <p>🚀 Welcome to a smarter and safer digital ecosystem.</p>

  </div>
  `;
};

//
// ================= OTP EMAIL TEMPLATE =================
//
const buildOtpEmail = (otp) => {
  return `
  <div style="font-family:Arial; padding:20px; color:#222; line-height:1.6">

    <h2>AlertAIQ Email Verification</h2>

    <p>Please verify your account using the OTP below:</p>

    <h1 style="color:#1a73e8">${otp}</h1>

    <h3>📌 Security Rules</h3>
    <ul>
      <li>OTP valid for 5 minutes only</li>
      <li>Do not share this code with anyone</li>
      <li>Use only on official AlertAIQ platform</li>
      <li>AlertAIQ never asks OTP via call/SMS</li>
      <li>Ignore if you didn’t request this</li>
    </ul>

    <p style="font-size:13px; color:gray">
      This is an automated security message from AlertAIQ.
    </p>

  </div>
  `;
};

//
// ================= REGISTER =================
//
router.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password)
      return error(res, 400, "All fields are required.");

    email = email.toLowerCase().trim();

    const exists = await User.findOne({ email });
    if (exists)
      return error(res, 409, "Account already exists.");

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashed,
      isVerified: false,
    });

    // ================= SEND WELCOME EMAIL =================
    await sendMail(
      email,
      "Welcome to AlertAIQ - Account Created",
      buildAccountEmail(name, email)
    );

    // ================= OTP GENERATION =================
    const otp = generateOTP();

    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });

    const otpSent = await sendMail(
      email,
      "AlertAIQ - Verification OTP",
      buildOtpEmail(otp)
    );

    if (!otpSent) {
      return error(res, 500, "Account created but OTP email failed.");
    }

    return success(
      res,
      `Registration successful. A verification OTP has been sent to your email. Please verify your account to activate all features.`
    );

  } catch (err) {
    console.error(err);
    return error(res, 500, "Registration failed.");
  }
});

//
// ================= VERIFY OTP =================
//
router.post("/verify-otp", async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp)
      return error(res, 400, "Email and OTP required.");

    email = email.toLowerCase().trim();

    const record = await OTP.findOne({ email });

    if (!record || record.otp != otp)
      return error(res, 400, "Invalid or expired OTP.");

    await User.updateOne({ email }, { isVerified: true });
    await OTP.deleteMany({ email });

    const user = await User.findOne({ email });

    return sendAuthResponse(
      user,
      res,
      "Email verified successfully. Welcome to AlertAIQ."
    );

  } catch (err) {
    console.error(err);
    return error(res, 500, "OTP verification failed.");
  }
});

module.exports = router;
