const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const OTP = require("../models/OTP");

const sendMail = require("../services/mailer");
const generateOTP = require("../utils/generateOTP");

const router = express.Router();

// ================= HELPERS =================
const success = (res, message, data = {}) =>
  res.status(200).json({ success: true, message, ...data });

const error = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ================= TOKEN =================
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ================= AUTH RESPONSE =================
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

// ================= OTP EMAIL TEMPLATE =================
const buildOtpEmail = (otp) => {
  return `
  <div style="font-family:Arial; padding:20px; color:#222; line-height:1.6">

    <h2>AlertAIQ Account Verification</h2>

    <p>Dear User,</p>

    <p>
      To complete your registration, please use the One-Time Password (OTP) below.
    </p>

    <h1 style="color:#1a73e8; letter-spacing:2px">${otp}</h1>

    <p><b>Security Instructions:</b></p>
    <ul>
      <li>Valid for 5 minutes only</li>
      <li>Do not share this OTP</li>
      <li>If not requested, ignore this email</li>
    </ul>

    <hr/>

    <p style="font-size:12px; color:gray">
      AlertAIQ is a secure AI-based monitoring system ensuring encrypted digital protection.
    </p>

  </div>
  `;
};

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password)
      return error(res, 400, "All fields are required.");

    email = email.toLowerCase().trim();

    const exists = await User.findOne({ email });
    if (exists)
      return error(res, 409, "An account with this email already exists.");

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashed,
      isVerified: false,
    });

    // ================= OTP =================
    const otp = generateOTP();

    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });

    const sent = await sendMail(
      email,
      "AlertAIQ - Email Verification OTP",
      buildOtpEmail(otp)
    );

    if (!sent)
      return error(res, 500, "OTP email failed. Try again.");

    // ================= PROFESSIONAL MESSAGE (MERGED STYLE) =================
    return success(
      res,
      `Registration successful.

Your AlertAIQ account has been created and is currently pending verification.

✔ Step 1: Account created securely  
✔ Step 2: OTP sent to your registered email  

To activate full access, please verify your email using the OTP sent to your inbox.

AlertAIQ ensures encrypted authentication, AI-driven monitoring, and secure data handling for all users.`
    );

  } catch (err) {
    console.error(err);
    return error(res, 500, "Registration failed. Please try again later.");
  }
});

// ================= VERIFY OTP =================
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
