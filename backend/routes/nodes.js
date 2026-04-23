const express = require("express");
const Node = require("../models/Node");
const auth = require("../middleware/auth");

const router = express.Router();


// ================= CREATE NODE =================
router.post("/", auth, async (req, res) => {
  try {
    const node = new Node({
      ...req.body,
      userId: req.user.id // 🔥 FIXED
    });

    await node.save();
    res.json(node);

  } catch (err) {
    console.error("CREATE NODE ERROR:", err);
    res.status(500).json({ msg: "Error creating node" });
  }
});


// ================= GET USER NODES =================
router.get("/", auth, async (req, res) => {
  try {
    const nodes = await Node.find({ userId: req.user.id }); // 🔥 FIXED
    res.json(nodes);

  } catch (err) {
    console.error("FETCH NODE ERROR:", err);
    res.status(500).json({ msg: "Error fetching nodes" });
  }
});


// ================= DELETE NODE (SECURE) =================
router.delete("/:id", auth, async (req, res) => {
  try {
    const node = await Node.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id // 🔥 FIXED
    });

    if (!node) {
      return res.status(404).json({ msg: "Node not found" });
    }

    res.json({ msg: "Deleted successfully" });

  } catch (err) {
    console.error("DELETE NODE ERROR:", err);
    res.status(500).json({ msg: "Error deleting node" });
  }
});


// ================= UPDATE NODE (SECURE) =================
router.put("/:id", auth, async (req, res) => {
  try {
    const node = await Node.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id // 🔥 FIXED
      },
      req.body,
      { new: true }
    );

    if (!node) {
      return res.status(404).json({ msg: "Node not found" });
    }

    res.json(node);

  } catch (err) {
    console.error("UPDATE NODE ERROR:", err);
    res.status(500).json({ msg: "Error updating node" });
  }
});

module.exports = router;