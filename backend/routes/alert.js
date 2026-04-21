const express = require("express");
const Alert = require("../models/Alert");
const sendMail = require("../services/mailer");
const auth = require("../middleware/authMiddleware");

const router = express.Router();


// CREATE ALERT
router.post("/create", auth, async (req, res) => {
  const alert = await Alert.create({
    userId: req.user.id,
    ...req.body
  });

  await sendMail(
    req.body.email,
    "AlertAIQ Confirmation",
    `Alert created: ${alert.subCategory}, Amount: ₹${alert.amount}`
  );

  res.json(alert);
});


// GET USER ALERTS
router.get("/", auth, async (req, res) => {
  const alerts = await Alert.find({ userId: req.user.id });
  res.json(alerts);
});

module.exports = router;
