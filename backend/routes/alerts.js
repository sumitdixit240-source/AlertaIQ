const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");
const auth = require("../middleware/authMiddleware");

// CREATE ALERT
router.post("/", auth, async (req, res) => {
  const alert = await Alert.create({
    userId: req.user.id,
    title: req.body.title,
    amount: req.body.amount,
    expiry: req.body.expiry
  });

  res.json(alert);
});

// GET ALERTS
router.get("/", auth, async (req, res) => {
  const alerts = await Alert.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(alerts);
});

module.exports = router;
