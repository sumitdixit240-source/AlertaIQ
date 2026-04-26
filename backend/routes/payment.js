import express from "express";
import crypto from "crypto";
import auth from "../middleware/auth.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js"; // ✅ IMPORTANT (for premium flag)

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

// ================= HEALTH =================
router.get("/", auth, (req, res) => {
    res.json({
        success: true,
        message: "AlertaiQ Payment API running 🚀",
        razorpay: !!razorpay
    });
});

// ================= CREATE ORDER =================
router.post("/create-order", auth, async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: "Payment service not available"
            });
        }

        // FIXED PREMIUM PRICE = ₹1
        const amount = 1;

        const options = {
            amount: amount * 100, // paise
            currency: "INR",
            receipt: `alertaiq_${req.user.id}_${Date.now()}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

        await Payment.create({
            userId: req.user.id,
            orderId: order.id,
            amount,
            status: "created"
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
router.post("/verify", auth, async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: "Payment service not available"
            });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // 🔐 FIND PAYMENT
        const payment = await Payment.findOne({
            orderId: razorpay_order_id,
            userId: req.user.id
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found"
            });
        }

        // 🔐 SIGNATURE VALIDATION
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            payment.status = "failed";
            await payment.save();

            return res.status(400).json({
                success: false,
                message: "Invalid signature"
            });
        }

        // 🔥 SUCCESS PAYMENT
        payment.paymentId = razorpay_payment_id;
        payment.status = "paid";
        await payment.save();

        // 🔥 GIVE PREMIUM ACCESS
        await User.findByIdAndUpdate(req.user.id, {
            isPremium: true
        });

        res.json({
            success: true,
            message: "Payment verified + Premium activated 🚀"
        });

    } catch (error) {
        console.error("Verify Payment Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Verification failed"
        });
    }
});

export default router;