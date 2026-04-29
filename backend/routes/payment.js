const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

router.post("/unlock", auth, async (req, res) => {
  const { freq } = req.body;

  const user = await User.findById(req.user);

  if (!user.unlockedFrequencies.includes(freq)) {
    user.unlockedFrequencies.push(freq);
    await user.save();
  }

  res.json({ msg: "Unlocked successfully" });
});

module.exports = router;