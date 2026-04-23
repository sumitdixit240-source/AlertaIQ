import express from "express";
import crypto from "crypto";

let Razorpay;
try {
    Razorpay = (await import("razorpay")).default;
} catch (err) {
    console.warn("⚠️ Razorpay not installed - payment disabled");
}

const router = express.Router();

// ================= INIT =================
let razorpay = null;

if (Razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}

// ================= CREATE ORDER =================
router.post("/create-order", async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: "Payment service not available"
            });
        }

        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({
                success: false,
                message: "Amount required"
            });
        }

        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        });

        res.json({
            success: true,
            order
        });

    } catch (error) {
        console.error("Create Order Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Order creation failed"
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

        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expected === razorpay_signature) {
            return res.json({
                success: true,
                message: "Payment verified"
            });
        }

        return res.status(400).json({
            success: false,
            message: "Invalid signature"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Verification failed"
        });
    }
});

export default router;