const express = require("express");
const router = express.Router();

const Node = require("../models/Node");
const User = require("../models/User");
const auth = require("../middleware/auth");


// ================= GET NODES =================
router.get("/", auth, async (req, res) => {
  const nodes = await Node.find({ userId: req.user.id })
    .sort({ createdAt: -1 });

  res.json(nodes);
});


// ================= CREATE NODE (LIMIT SAFE) =================
router.post("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const count = await Node.countDocuments({ userId: req.user.id });

    // 🔒 PRO LIMIT ENFORCEMENT
    if (!user.isPro && count >= 2) {
      return res.status(403).json({
        error: "Free limit reached (2 nodes max)"
      });
    }

    const { cat, sub, freq, amt, expiry } = req.body;

    const node = await Node.create({
      userId: req.user.id, // 🔒 ALWAYS SERVER CONTROLLED
      cat,
      sub,
      freq,
      amt,
      expiry
    });

    res.json(node);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


// ================= DELETE NODE =================
router.delete("/:id", auth, async (req, res) => {
  const node = await Node.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!node) {
    return res.status(404).json({ error: "Not found" });
  }

  await node.deleteOne();
  res.json({ success: true });
});


// ================= UPDATE NODE =================
router.put("/:id", auth, async (req, res) => {
  const node = await Node.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.user.id // 🔒 ownership lock
    },
    req.body,
    { new: true }
  );

  if (!node) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json(node);
});


// ================= USER PROFILE =================
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});


// ================= UPGRADE USER =================
router.post("/upgrade", auth, async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { isPro: true });

  res.json({
    success: true,
    message: "Upgraded to Pro"
  });
});

module.exports = router;
