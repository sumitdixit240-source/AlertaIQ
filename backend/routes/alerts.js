const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");
const auth = require("../middleware/authMiddleware");

/* CREATE ALERT */
router.post("/", auth, async (req, res) => {
  try {
    const alert = await Alert.create({
      ...req.body,
      userId: req.user.userId
    });
    res.json(alert);
  } catch {
    res.status(500).json({ message: "Failed to create alert" });
  }
});

/* GET ALERTS */
router.get("/", auth, async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user.userId });
    res.json(alerts);
  } catch {
    res.status(500).json({ message: "Failed to fetch alerts" });
  }
});

/* DELETE ALERT */
router.delete("/:id", auth, async (req, res) => {
  try {
    await Alert.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;