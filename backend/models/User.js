const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ================= BASIC INFO =================
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // ================= SECURITY =================
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ================= ACCOUNT STATUS =================
    isVerified: {
      type: Boolean,
      default: false,
    },

    // ================= PREMIUM SYSTEM =================
    isPremium: {
      type: Boolean,
      default: false,
    },

    plan: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },

    // 🆕 Premium expiry (IMPORTANT for SaaS)
    premiumExpiresAt: {
      type: Date,
      default: null,
    },

    // ================= PAYMENT TRACKING =================
    razorpayCustomerId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    // ================= SECURITY TOKENS =================
    tokenVersion: {
      type: Number,
      default: 0,
    },

    // ================= LOGIN TRACKING =================
    lastLogin: {
      type: Date,
      default: null,
    },

    // 🆕 Password reset (future use)
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);


// ================= PASSWORD HASHING =================
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (err) {
    next(err);
  }
});


// ================= PASSWORD CHECK =================
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};


// ================= LOGIN TRACKING =================
userSchema.methods.updateLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};


// ================= PREMIUM CHECK =================
userSchema.methods.checkPremiumStatus = function () {
  if (this.premiumExpiresAt && this.premiumExpiresAt < new Date()) {
    this.isPremium = false;
    this.plan = "free";
  }
  return this.isPremium;
};


module.exports = mongoose.model("User", userSchema);
