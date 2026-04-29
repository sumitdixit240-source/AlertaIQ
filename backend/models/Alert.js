const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    // ================= USER ISOLATION =================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // ⚠️ Optional redundancy removed (email can be fetched via userId)
    email: {
      type: String,
      lowercase: true,
      trim: true
    },

    // ================= ALERT DATA =================
    category: {
      type: String,
      default: null,
      index: true
    },

    subCategory: {
      type: String,
      default: null
    },

    title: {
      type: String,
      default: "Alert"
    },

    description: {
      type: String,
      default: ""
    },

    amount: {
      type: Number,
      default: 0
    },

    expiry: {
      type: Date,
      index: true
    },

    // ================= SCHEDULING =================
    frequency: {
      type: String,
      enum: ["once", "daily", "weekly", "monthly"],
      default: "once",
      index: true
    },

    lastSent: {
      type: Date,
      default: null
    },

    sentCount: {
      type: Number,
      default: 0
    },

    // ================= STATUS CONTROL =================
    status: {
      type: String,
      enum: ["active", "sent", "expired"],
      default: "active",
      index: true
    }
  },
  {
    timestamps: true
  }
);


// ================= PERFORMANCE INDEXES =================
alertSchema.index({ userId: 1, createdAt: -1 });
alertSchema.index({ userId: 1, expiry: 1 });
alertSchema.index({ status: 1, expiry: 1 });

module.exports = mongoose.model("Alert", alertSchema);