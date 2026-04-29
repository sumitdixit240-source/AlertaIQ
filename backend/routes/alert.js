const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");
const auth = require("../middleware/auth");
const sendEmail = require("../services/mailer");

// ✅ CREATE NODE
router.post("/", auth, async (req, res) => {
  try {
    const alert = new Alert({
      ...req.body,
      user: req.user,
    });

    await alert.save();

    // 📧 Confirmation Email (300 words professional)
    await sendEmail(
      alert.email,
      "AlertaiQ Node Registration Successful",
      `
      <h2>AlertaiQ Confirmation</h2>

      <p>
      Your entity is now successfully registered and actively monitored under AlertaiQ.
      Our system will continuously track your service and notify you based on your selected frequency.
      </p>

      <h3>Node Details:</h3>
      <ul>
        <li><b>Node:</b> ${alert.nodeName}</li>
        <li><b>Owner:</b> ${alert.ownerName}</li>
        <li><b>Sector:</b> ${alert.sector}</li>
        <li><b>Service:</b> ${alert.subService}</li>
        <li><b>Amount:</b> ₹${alert.amount}</li>
        <li><b>Frequency:</b> ${alert.frequency}</li>
        <li><b>Expiry:</b> ${alert.expiryDate}</li>
      </ul>

      <p><b>Created At:</b> ${new Date()}</p>

      <hr>

      <p style="font-size:12px;">
      AlertaiQ is an intelligent monitoring platform that helps individuals and businesses manage subscriptions,
      track recurring payments, and receive timely alerts using automation and smart scheduling.
      </p>
      `
    );

    res.json({
      msg: "Node created successfully. Email sent.",
      alert,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ GET USER DATA (ISOLATED)
router.get("/", auth, async (req, res) => {
  const alerts = await Alert.find({ user: req.user });
  res.json(alerts);
});

module.exports = router;