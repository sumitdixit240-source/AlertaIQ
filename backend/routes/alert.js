const express = require("express");
const router = express.Router();

const Alert = require("../models/Alert");
const auth = require("../middleware/authMiddleware");
const sendEmail = require("../services/mailer");


// ================= CREATE NODE =================
router.post("/", auth, async (req, res) => {
  try {
    const {
      nodeName,
      ownerName,
      sector,
      subService,
      amount,
      frequency,
      expiryDate,
      email,
    } = req.body;

    // ================= VALIDATION =================
    if (
      !nodeName ||
      !ownerName ||
      !sector ||
      !subService ||
      !amount ||
      !frequency ||
      !expiryDate ||
      !email
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ================= CREATE ALERT =================
    const alert = await Alert.create({
      nodeName,
      ownerName,
      sector,
      subService,
      amount,
      frequency,
      expiryDate,
      email,
      user: req.user,
    });

    // ================= EMAIL (SAFE WRAPPED) =================
    try {
      await sendEmail(
        email,
        "AlertaiQ Node Registration Successful",
        `
        <h2>AlertaiQ Confirmation</h2>

        <p>Your node has been successfully registered and is now being monitored.</p>

        <h3>Node Details:</h3>
        <ul>
          <li><b>Node:</b> ${nodeName}</li>
          <li><b>Owner:</b> ${ownerName}</li>
          <li><b>Sector:</b> ${sector}</li>
          <li><b>Service:</b> ${subService}</li>
          <li><b>Amount:</b> ₹${amount}</li>
          <li><b>Frequency:</b> ${frequency}</li>
          <li><b>Expiry:</b> ${expiryDate}</li>
        </ul>

        <p><b>Created At:</b> ${new Date().toLocaleString()}</p>

        <hr>

        <p style="font-size:12px;">
        AlertaiQ helps users track subscriptions, automate reminders, and manage recurring services efficiently.
        </p>
        `
      );
    } catch (emailErr) {
      console.error("EMAIL ERROR:", emailErr.message);
      // ⚠️ Don't fail request if email fails
    }

    return res.json({
      success: true,
      message: "Node created successfully",
      alert,
    });

  } catch (err) {
    console.error("CREATE ALERT ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


// ================= GET USER ALERTS =================
router.get("/", auth, async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.user }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: alerts,
    });

  } catch (err) {
    console.error("GET ALERTS ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch alerts",
    });
  }
});

module.exports = router;
