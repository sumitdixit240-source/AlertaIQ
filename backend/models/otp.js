const express = require("express");
const router = express.Router();
const OTP = require("../models/OTP");

// example route
router.post("/create", async (req, res) => {
  try {
    const otp = await OTP.create(req.body);
    res.json(otp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
