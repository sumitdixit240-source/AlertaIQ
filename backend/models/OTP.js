const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    otp: {
      type: String,
      required: true,
    },

    // ⏱ Auto-expire document after 5 minutes (300 sec)
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // TTL index (ONLY place used)
    },

    // 🔐 Optional SaaS improvements
    purpose: {
      type: String,
      enum: ["login", "signup", "reset"],
      default: "login",
    },

    attempts: {
      type: Number,
      default: 0,
    },

    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ⚠️ No extra indexes needed (avoid duplication)
// email index already handled above
// TTL handled by createdAt field only

module.exports = mongoose.model("OTP", otpSchema);