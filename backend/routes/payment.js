import express from "express";

let Razorpay;
try {
    Razorpay = (await import("razorpay")).default;
} catch (err) {
    console.error("❌ Razorpay not installed");
}

import crypto from "crypto";

const router = express.Router();

// ================= RAZORPAY INSTANCE =================
let razorpay;

if (Razorpay) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}

// ================= CREATE ORDER =================
router.post("/create-order", async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(500).json({
                success: false,
                message: "Razorpay not configured on server"
            });
        }

        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({
                success: false,
                message: "Amount is required"
            });
        }

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            order
        });

    } catch (error) {
        console.error("Create Order Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Payment order failed"
        });
    }
});

// ================= VERIFY PAYMENT =================
router.post("/verify", (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            return res.json({
                success: true,
                message: "Payment verified"
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid signature"
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Verification failed"
        });
    }
});

export default router;
