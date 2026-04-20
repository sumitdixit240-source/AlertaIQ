const router = require("express").Router();
const { createOrder } = require("../services/razorpayService");
const User = require("../models/User");

// CREATE ORDER
router.post("/order", async (req,res)=>{
  const order = await createOrder(req.body.plan);
  res.json(order);
});

// WEBHOOK (IMPORTANT)
router.post("/webhook", async (req,res)=>{

  const payment = req.body;

  if(payment.event === "payment.captured"){

    const userId = payment.payload.payment.entity.notes.userId;

    await User.findByIdAndUpdate(userId,{
      plan: "GOLD"
    });

  }

  res.sendStatus(200);
});

module.exports = router;
