const express = require("express");
const router = express.Router();
const razorpay = require("../services/razorpay");

router.post("/create-order", async (req, res) => {
  const options = {
    amount: req.body.amount * 100,
    currency: "INR",
    receipt: "order_rcptid_11",
  };

  const order = await razorpay.orders.create(options);
  res.json(order);
});

module.exports = router;
