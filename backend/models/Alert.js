const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  category: {
    type: String,
    default: null
  },

  subCategory: {
    type: String,
    default: null
  },

  title: {
    type: String,
    default: null
  },

  description: {
    type: String,
    default: null
  },

  amount: {
    type: Number,
    default: null
  },

  expiry: {
    type: Date,
    default: null
  },

  frequency: {
    type: String,
    default: "once"
  },

  lastSent: {
    type: Date,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Alert", alertSchema);