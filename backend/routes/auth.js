const express = require("express");
const router = express.Router();

const User = require("../models/User");
const OTP = require("../models/OTP");

const bcrypt = require("bcryptjs");
const generateOTP = require("../utils/generateOTP");
const generateToken = require("../utils/jwt");

let sendEmailOTP;
try {
  ({ sendEmailOTP } = require("../services/mailer"));
} catch (e) {
  console.log("Mailer not loaded");
}

/* =========================
   REGISTER USER
========================= */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "User exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    // OTP generate
    const otp = generateOTP();

    await OTP.create({
      email,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    if (sendEmailOTP) await sendEmailOTP(email, otp);

    res.json({
      msg: "User registered. OTP sent.",
      userId: user._id,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* =========================
   VERIFY OTP
========================= */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email, otp });
    if (!record) return res.status(400).json({ msg: "Invalid OTP" });

    if (record.expiresAt < Date.now())
      return res.status(400).json({ msg: "OTP expired" });

    await User.updateOne({ email }, { isVerified: true });
    await OTP.deleteMany({ email });

    const token = generateToken(record._id);

    res.json({ msg: "Verified", token });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "No user" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    const token = generateToken(user._id);

    res.json({ msg: "Login success", token });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
