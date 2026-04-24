const express = require("express");
const router = express.Router();

const Node = require("../models/Node");
const User = require("../models/User");
const auth = require("../middleware/auth");


// ================= GET USER NODES =================
router.get("/", auth, async (req, res) => {
  try {
    const nodes = await Node.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(nodes);
  } catch (err) {
    console.error("GET NODES ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch nodes" });
  }
});


// ================= CREATE NODE (FINAL MERGED VERSION) =================
router.post("/", auth, async (req, res) => {
  try {
    const {
      cat,
      sub,
      freq,
      amt,
      expiry,

      // frontend-safe fallback support
      category,
      title,
      frequency,
      amount,
      expiryDate
    } = req.body;

    // 🔒 VALIDATION (SAFE BUT FLEXIBLE)
    const finalCategory = category || cat;
    const finalTitle = title || sub;
    const finalFreq = frequency || freq;
    const finalAmount = amount ?? amt;
    const finalExpiry = expiryDate || expiry;

    if (!finalCategory || !finalTitle || !finalFreq || finalAmount == null || !finalExpiry) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    // 🔒 USER CHECK
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 🔒 FREE LIMIT CHECK
    const count = await Node.countDocuments({ userId: req.user.id });

    if (!user.isPro && count >= 2) {
      return res.status(403).json({
        error: "Free limit reached (Max 2 nodes)"
      });
    }

    // 🔥 CREATE NODE (FINAL NORMALIZED SCHEMA)
    const node = await Node.create({
      userId: req.user.id,
      category: finalCategory,
      title: finalTitle,
      frequency: finalFreq,
      amount: finalAmount,
      expiryDate: finalExpiry,
      createdAt: new Date()
    });

    res.status(201).json(node);

  } catch (err) {
    console.error("CREATE NODE ERROR:", err.message);
    res.status(500).json({ error: "Failed to create node" });
  }
});


// ================= UPDATE NODE =================
router.put("/:id", auth, async (req, res) => {
  try {
    const node = await Node.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id
      },
      { $set: req.body },
      { new: true }
    );

    if (!node) {
      return res.status(404).json({
        error: "Node not found or unauthorized"
      });
    }

    res.json(node);

  } catch (err) {
    console.error("UPDATE ERROR:", err.message);
    res.status(500).json({ error: "Update failed" });
  }
});


// ================= DELETE NODE =================
router.delete("/:id", auth, async (req, res) => {
  try {
    const node = await Node.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!node) {
      return res.status(404).json({
        error: "Node not found or unauthorized"
      });
    }

    res.json({
      success: true,
      message: "Node deleted successfully",
      id: req.params.id
    });

  } catch (err) {
    console.error("DELETE ERROR:", err.message);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;