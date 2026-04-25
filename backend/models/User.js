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
      default: "User"
    },

    email: {
      type: String,
      required: true,
      unique: true, // ✅ single source of truth for index
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },

    // ================= ACCOUNT STATUS =================
    isVerified: {
      type: Boolean,
      default: false
    },

    isPro: {
      type: Boolean,
      default: false
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    // ================= SECURITY =================
    tokenVersion: {
      type: Number,
      default: 0
    },

    // ================= TRACKING =================
    lastLogin: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);


// ================= PASSWORD HASH =================
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
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};


// ================= SECURITY HELPERS =================
userSchema.methods.incrementTokenVersion = async function () {
  this.tokenVersion += 1;
  await this.save();
};


module.exports = mongoose.model("User", userSchema);