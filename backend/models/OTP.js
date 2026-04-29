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

    // OTP creation time (TTL controlled here)
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // auto delete after 5 minutes
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookup index
otpSchema.index({ email: 1 });

module.exports = mongoose.model("OTP", otpSchema);
