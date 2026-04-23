const express = require("express");
const router = express.Router();

const Node = require("../models/Node");
const User = require("../models/User");
const auth = require("../middleware/auth");

// GET USER NODES
router.get("/", auth, async (req, res) => {
  try {
    const nodes = await Node.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch nodes" });
  }
});

// CREATE NODE
router.post("/", auth, async (req, res) => {
  try {
    const { cat, sub, freq, amt, expiry } = req.body;

    const user = await User.findById(req.user.id);
    const count = await Node.countDocuments({ userId: req.user.id });

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.isPro && count >= 2) {
      return res.status(403).json({ error: "Free limit reached" });
    }

    const node = await Node.create({
      userId: req.user.id,
      cat,
      sub,
      freq,
      amt,
      expiry
    });

    res.json(node);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
