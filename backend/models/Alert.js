const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  userId: String,
  email: String, // ✅ add this
  category: String,
  subCategory: String,
  amount: Number,
  expiry: Date,
  frequency: String,
  lastSent: Date, // ✅ prevent duplicate emails
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Alert", alertSchema);