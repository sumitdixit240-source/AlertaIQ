const express = require("express");
const Alert = require("../models/Alert");
const sendMail = require("../services/mailer");
const auth = require("../middleware/authMiddleware");

const router = express.Router();


// ===================== CREATE ALERT =====================
router.post("/create", auth, async (req, res) => {
  try {
    const { category, subCategory, amount, expiry, frequency, email } = req.body;

    const alert = await Alert.create({
      userId: req.user.id,
      category,
      subCategory,
      amount,
      expiry,
      frequency
    });

    await sendMail(
      email,
      "AlertAIQ - Alert Created",
      `
Alert Created Successfully:

Service: ${subCategory}
Category: ${category}
Amount: ₹${amount}
Expiry: ${expiry}
Frequency: ${frequency}

You will receive automated reminders based on your settings.
      `
    );

    res.json({ msg: "Alert created successfully", alert });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// ===================== GET USER ALERTS =====================
router.get("/", auth, async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user.id });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// ===================== DELETE ALERT =====================
router.delete("/:id", auth, async (req, res) => {
  try {
    await Alert.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ msg: "Alert deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
