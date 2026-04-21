const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  userId: String,
  category: String,
  subCategory: String,
  amount: Number,
  expiry: Date,
  frequency: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Alert", alertSchema);
