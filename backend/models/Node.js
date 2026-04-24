const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema(
  {
    // 🔒 USER OWNERSHIP (CRITICAL FOR ISOLATION)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      immutable: true // prevents changing ownership
    },

    // ================= CORE FIELDS =================
    category: {
      type: String,
      required: true,
      trim: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly", "one-time"],
      default: "monthly"
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    expiryDate: {
      type: Date
    }
  },
  {
    timestamps: true,   // auto adds createdAt & updatedAt
    versionKey: false
  }
);

module.exports = mongoose.model("Node", nodeSchema);