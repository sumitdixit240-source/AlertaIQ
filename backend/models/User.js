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
      select: false, // never return password
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ✅ EMAIL / ACCOUNT VERIFICATION
    isVerified: {
      type: Boolean,
      default: false,
    },

    // ✅ PRO / PREMIUM FEATURE FLAG
    isPro: {
      type: Boolean,
      default: false,
    },

    // 🔐 TOKEN SECURITY (logout all devices support)
    tokenVersion: {
      type: Number,
      default: 0,
    },

    // 📌 TRACK LOGIN TIME
    lastLogin: {
      type: Date,
      default: null,
    },
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

module.exports = mongoose.model("User", userSchema);