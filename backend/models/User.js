const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

