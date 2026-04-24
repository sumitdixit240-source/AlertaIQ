const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
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
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false // 🔥 prevents password leak
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    lastLogin: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);



// ================= PASSWORD HASH (FIXED & SAFE) =================
userSchema.pre("save", async function () {
  try {
    // 🔥 Only hash if password is modified
    if (!this.isModified("password")) return;

    // 🔥 Prevent double hashing
    if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) {
      return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

  } catch (err) {
    console.error("Password hashing error:", err);
    throw err;
  }
});



// ================= PASSWORD COMPARE =================
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};



module.exports = mongoose.model("User", userSchema);