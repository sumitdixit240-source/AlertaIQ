const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema(
  {
    // 🔒 USER OWNERSHIP (CRITICAL FOR ISOLATION)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      immutable: true // ✅ prevents changing ownership
    },

    // ================= CORE FIELDS =================
    cat: {
      type: String,
      required: true,
      trim: true
    },

    sub: {
      type: String,
      required: true,
      trim: true
    },

    freq: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly", "one-time"],
      default: "monthly"
    },

    amt: {
      type: Number,
      required: true,
      min: 0
    },

    expiry: {
      type: Date
    }
  },
  {
    timestamps: true,   // ✅ auto adds createdAt & updatedAt
    versionKey: false
  }
);

module.exports = mongoose.model("Node", nodeSchema);