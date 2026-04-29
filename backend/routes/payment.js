const express = require("express");
const router = express.Router();

const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

// ================= UNLOCK FREQUENCY =================
router.post("/unlock", auth, async (req, res) => {
  try {
    const { freq } = req.body;

    if (!freq) {
      return res.status(400).json({
        success: false,
        message: "Frequency is required"
      });
    }

    const userId = req.user;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ensure array exists (prevents crash)
    if (!user.unlockedFrequencies) {
      user.unlockedFrequencies = [];
    }

    // prevent duplicates
    if (!user.unlockedFrequencies.includes(freq)) {
      user.unlockedFrequencies.push(freq);
      await user.save();
    }

    return res.json({
      success: true,
      message: "Unlocked successfully",
      unlockedFrequencies: user.unlockedFrequencies
    });

  } catch (error) {
    console.error("Unlock Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
