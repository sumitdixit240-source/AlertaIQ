const express = require("express");
const router = express.Router();

const Node = require("../models/Node");
const User = require("../models/User");
const auth = require("../middleware/auth");


// ================= GET ONLY USER NODES =================
router.get("/", auth, async (req, res) => {
  try {
    const nodes = await Node.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(nodes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch nodes" });
  }
});


// ================= CREATE NODE (SECURE + LIMIT SAFE) =================
router.post("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const count = await Node.countDocuments({ userId: req.user.id });

    // 🔒 Free plan restriction
    if (!user.isPro && count >= 2) {
      return res.status(403).json({
        error: "Free limit reached (2 nodes max)"
      });
    }

    // 🔒 ONLY ALLOWED FIELDS
    const { cat, sub, freq, amt, expiry } = req.body;

    const node = await Node.create({
      userId: req.user.id, // ALWAYS SERVER CONTROLLED
      cat,
      sub,
      freq,
      amt,
      expiry
    });

    res.json(node);

  } catch (err) {
    res.status(500).json({ error: "Server error while creating node" });
  }
});


// ================= UPDATE NODE (FULLY SECURED) =================
router.put("/:id", auth, async (req, res) => {
  try {
    // 🔒 ONLY ALLOWED FIELDS (NO req.body DIRECT USE)
    const { cat, sub, freq, amt, expiry } = req.body;

    const node = await Node.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id // ownership lock
      },
      {
        cat,
        sub,
        freq,
        amt,
        expiry
      },
      { new: true }
    );

    if (!node) {
      return res.status(404).json({ error: "Node not found" });
    }

    res.json(node);

  } catch (err) {
    res.status(500).json({ error: "Failed to update node" });
  }
});


// ================= DELETE NODE (OWNERSHIP VERIFIED) =================
router.delete("/:id", auth, async (req, res) => {
  try {
    const node = await Node.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!node) {
      return res.status(404).json({ error: "Node not found" });
    }

    await node.deleteOne();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Failed to delete node" });
  }
});


// ================= USER PROFILE (SAFE) =================
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});


// ================= UPGRADE USER (SECURED PLACEHOLDER) =================
router.post("/upgrade", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // 🔒 PLACEHOLDER SECURITY LAYER (YOU MUST REPLACE THIS)
    const { paymentVerified, isAdmin } = req.body;

    if (!paymentVerified && !isAdmin) {
      return res.status(403).json({
        error: "Unauthorized upgrade attempt"
      });
    }

    user.isPro = true;
    await user.save();

    res.json({
      success: true,
      message: "Upgraded to Pro"
    });

  } catch (err) {
    res.status(500).json({ error: "Upgrade failed" });
  }
});

module.exports = router;
