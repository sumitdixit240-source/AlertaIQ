const Razorpay = require("razorpayService");

const razorpay = new Razorpay({
  key_id: process.env.RZP_KEY,
  key_secret: process.env.RZP_SECRET
});

exports.createOrder = async (plan) => {

  const prices = {
    silver: 29900,
    gold: 59900,
    platinum: 399900
  };

  return await razorpay.orders.create({
    amount: prices[plan],
    currency: "INR"
  });
};
