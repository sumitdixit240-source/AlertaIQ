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
    {
      id: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

//
// ================= AUTH RESPONSE =================
// ✅ FIXED: sends token ALSO in response (frontend compatible)
//
const sendAuthResponse = (user, res, message) => {
  const token = createToken(user);

  // Cookie (for production security)
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
  });

  return success(res, message, {
    token, // ✅ IMPORTANT (frontend uses this)
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
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
      return error(res, 409, "Account already exists. Please login.");

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashed,
      isVerified: false,
    });

    return success(
      res,
      "Account created successfully. Please verify your email using OTP."
    );
  } catch (err) {
    return error(res, 500, "Registration failed. Please try again.");
  }
});

//
// ================= SEND OTP =================
//
router.post("/send-otp", async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) return error(res, 400, "Email is required.");

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user)
      return error(res, 404, "No account found with this email.");

    const otp = generateOTP();

    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });

    await sendMail(
      email,
      "AlertAIQ Security Verification Code",
      `
      <div style="font-family:Arial;padding:20px">
        <h2>AlertAIQ Account Security</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes. Do not share it with anyone.</p>
        <hr/>
        <p style="font-size:12px;color:gray">
          AlertAIQ - Smart Expense, Subscription & Security Intelligence Platform.
        </p>
      </div>
      `
    );

    return success(res, "OTP has been sent to your registered email.");
  } catch (err) {
    return error(res, 500, "Failed to send OTP.");
  }
});

//
// ================= VERIFY OTP =================
//
router.post("/verify-otp", async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp)
      return error(res, 400, "Email and OTP are required.");

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
    return error(res, 500, "OTP verification failed.");
  }
});

//
// ================= LOGIN =================
//
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password)
      return error(res, 400, "Email and password are required.");

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user)
      return error(res, 404, "Account not found.");

    if (!user.isVerified)
      return error(res, 403, "Please verify your email first.");

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return error(res, 401, "Invalid credentials.");

    return sendAuthResponse(
      user,
      res,
      "Login successful. Welcome back to AlertAIQ."
    );
  } catch (err) {
    return error(res, 500, "Login failed.");
  }
});

//
// ================= LOGOUT =================
//
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  return success(res, "Logged out successfully.");
});

//
// ================= GET PROFILE =================
//
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");

    return success(res, "User profile fetched.", { user });
  } catch (err) {
    return error(res, 500, "Failed to fetch profile.");
  }
});

module.exports = router;