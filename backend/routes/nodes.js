const express = require("express");
const router = express.Router();

const Node = require("../models/Node");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");


// ================= GET USER NODES =================
router.get("/", auth, async (req, res) => {
  try {
    const nodes = await Node.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: nodes
    });

  } catch (err) {
    console.error("GET NODES ERROR:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch nodes"
    });
  }
});


// ================= CREATE NODE =================
router.post("/", auth, async (req, res) => {
  try {
    const {
      cat,
      sub,
      freq,
      amt,
      expiry,
      category,
      title,
      frequency,
      amount,
      expiryDate
    } = req.body || {};

    const finalCategory = category || cat;
    const finalTitle = title || sub;
    const finalFreq = frequency || freq;
    const finalAmount = amount ?? amt;
    const finalExpiry = expiryDate || expiry;

    // validation
    if (!finalCategory || !finalTitle || !finalFreq || finalAmount == null || !finalExpiry) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    // user check
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // free plan limit
    const count = await Node.countDocuments({ userId: req.user.id });

    if (!user.isPro && count >= 2) {
      return res.status(403).json({
        success: false,
        error: "Free limit reached (Max 2 nodes)"
      });
    }

    // create node (clean + controlled fields only)
    const node = await Node.create({
      userId: req.user.id,
      category: finalCategory,
      title: finalTitle,
      frequency: finalFreq,
      amount: Number(finalAmount),
      expiryDate: new Date(finalExpiry),
      createdAt: new Date()
    });

    return res.status(201).json({
      success: true,
      data: node
    });

  } catch (err) {
    console.error("CREATE NODE ERROR:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to create node"
    });
  }
});


// ================= UPDATE NODE (SAFE VERSION) =================
router.put("/:id", auth, async (req, res) => {
  try {
    const allowedFields = [
      "category",
      "title",
      "frequency",
      "amount",
      "expiryDate"
    ];

    const updateData = {};

    allowedFields.forEach((key) => {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    const node = await Node.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id
      },
      { $set: updateData },
      { new: true }
    );

    if (!node) {
      return res.status(404).json({
        success: false,
        error: "Node not found or unauthorized"
      });
    }

    return res.json({
      success: true,
      data: node
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err.message);
    return res.status(500).json({
      success: false,
      error: "Update failed"
    });
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
        success: false,
        error: "Node not found or unauthorized"
      });
    }

    return res.json({
      success: true,
      message: "Node deleted successfully",
      id: req.params.id
    });

  } catch (err) {
    console.error("DELETE ERROR:", err.message);
    return res.status(500).json({
      success: false,
      error: "Delete failed"
    });
  }
});

module.exports = router;
