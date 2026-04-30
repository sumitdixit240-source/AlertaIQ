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

// ================= BRANDING =================
const COMPANY_NAME = "AlertAIQ";
const LOGO = "⚡"; // replace with image URL if needed

// =====================================================
// 📩 OTP EMAIL (300+ words + 5 points)
// =====================================================
const buildOtpEmail = (name, otp) => {
  return `
  <div style="font-family:Arial; padding:20px; color:#111; line-height:1.6">

    <div style="font-size:22px; font-weight:bold; color:#4f46e5">
      ${LOGO} ${COMPANY_NAME} Security Verification
    </div>

    <p>Dear <b>${name || "User"}</b>,</p>

    <p>
      Welcome to ${COMPANY_NAME}, your intelligent financial protection system.
      We are committed to securing your digital identity using AI-powered authentication,
      real-time monitoring, and encrypted verification systems designed for modern users.
    </p>

    <p>
      To complete your login or registration process, please use the One-Time Password (OTP) below.
      This OTP is uniquely generated for your session and ensures that only you can access your account.
    </p>

    <h2 style="color:#4f46e5; letter-spacing:4px">${otp}</h2>

    <p><b>Important Security Guidelines:</b></p>

    <ol>
      <li>This OTP is valid for 5 minutes only.</li>
      <li>Never share your OTP with anyone, including support staff.</li>
      <li>AlertAIQ never asks for OTP via call or message.</li>
      <li>If you did not request this, ignore this email immediately.</li>
      <li>Your data is protected with AES-level encryption and AI monitoring.</li>
    </ol>

    <p>
      At ${COMPANY_NAME}, we combine AI intelligence with financial tracking to ensure you never lose control of your expenses.
      Our system continuously monitors subscriptions, bills, and anomalies to keep your finances safe.
    </p>

    <hr/>

    <p style="font-size:12px; color:gray">
      ${COMPANY_NAME} is an AI-powered financial intelligence platform designed to help users track expenses,
      detect fraud, and optimize savings using real-time automation systems.
    </p>

  </div>
  `;
};

// =====================================================
// 📩 WELCOME EMAIL (150 words + 2 points)
// =====================================================
const buildWelcomeEmail = (name) => {
  return `
  <div style="font-family:Arial; padding:20px; line-height:1.6">

    <h2 style="color:#4f46e5">${LOGO} Welcome to ${COMPANY_NAME}, ${name}</h2>

    <p>
      Congratulations ${name}, your account has been successfully created with ${COMPANY_NAME}.
      You are now part of an advanced AI-driven financial protection ecosystem designed to help you
      monitor expenses, control subscriptions, and prevent unnecessary financial loss.
    </p>

    <p>
      Our mission is simple — give you complete visibility and control over your money using intelligent automation
      and real-time alerts.
    </p>

    <h3>What you get:</h3>
    <ul>
      <li>AI-powered expense tracking and smart alerts</li>
      <li>Secure encrypted dashboard for financial control</li>
    </ul>

    <p>
      ${COMPANY_NAME} is a next-generation financial intelligence platform built to simplify money management
      using automation, analytics, and smart prediction systems.
    </p>

  </div>
  `;
};

// =====================================================
// REGISTER
// =====================================================
router.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;
    if (!name || !email || !password)
      return error(res, 400, "All fields required");

    email = email.toLowerCase().trim();

    const exists = await User.findOne({ email });
    if (exists)
      return error(res, 409, "User already exists");

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      isVerified: false,
    });

    // send welcome email immediately
    await sendMail(
      email,
      `${COMPANY_NAME} - Account Created Successfully`,
      buildWelcomeEmail(name)
    );

    // generate OTP
    const otp = generateOTP();

    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });

    await sendMail(
      email,
      `${COMPANY_NAME} OTP Verification`,
      buildOtpEmail(name, otp)
    );

    return success(res, "Account created. OTP sent to email.");
  } catch (err) {
    console.error(err);
    return error(res, 500, "Register failed");
  }
});

// =====================================================
// SEND OTP
// =====================================================
router.post("/send-otp", async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) return error(res, 400, "Email required");

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    const otp = generateOTP();

    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });

    await sendMail(
      email,
      `${COMPANY_NAME} OTP Verification`,
      buildOtpEmail(user?.name, otp)
    );

    return success(res, "OTP sent successfully");
  } catch (err) {
    console.error(err);
    return error(res, 500, "Failed to send OTP");
  }
});

// =====================================================
// VERIFY OTP
// =====================================================
router.post("/verify-otp", async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (!email || !otp)
      return error(res, 400, "Email & OTP required");

    email = email.toLowerCase().trim();

    const record = await OTP.findOne({ email });
    if (!record || record.otp != otp)
      return error(res, 400, "Invalid OTP");

    const user = await User.findOne({ email });

    if (!user)
      return error(res, 404, "User not found");

    user.isVerified = true;
    await user.save();

    await OTP.deleteMany({ email });

    return sendAuthResponse(user, res, "Login successful");
  } catch (err) {
    console.error(err);
    return error(res, 500, "OTP verification failed");
  }
});

// =====================================================
// LOGIN
// =====================================================
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password)
      return error(res, 400, "Email & password required");

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user)
      return error(res, 404, "User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return error(res, 401, "Invalid credentials");

    return sendAuthResponse(user, res, "Login successful");
  } catch (err) {
    console.error(err);
    return error(res, 500, "Login failed");
  }
});

// =====================================================
// ME
// =====================================================
router.get("/me", async (req, res) => {
  try {
    let token =
      req.headers.authorization?.split(" ")[1] ||
      req.cookies?.token;

    if (!token)
      return error(res, 401, "No token");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user)
      return error(res, 404, "User not found");

    return success(res, "User profile", { data: user });
  } catch (err) {
    console.error(err);
    return error(res, 401, "Invalid token");
  }
});

module.exports = router;
