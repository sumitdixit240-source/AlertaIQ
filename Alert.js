const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
  userId:String,
  title:String,
  amount:Number,
  expiry:Date
});

module.exports = mongoose.model("Alert",AlertSchema);