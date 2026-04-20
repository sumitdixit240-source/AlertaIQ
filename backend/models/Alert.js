const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  name: String,
  service: String,
  amount: Number,
  frequency: String,
  expiryDate: Date
}, { timestamps: true });

module.exports = mongoose.model("Alert", alertSchema);