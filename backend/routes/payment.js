import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = express.Router();

// ================= RAZORPAY INSTANCE =================
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ================= CREATE ORDER =================
// POST /api/payment/create-order
router.post("/create-order", async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({
                success: false,
                message: "Amount is required"
            });
        }

        const options = {
            amount: amount * 100, // Razorpay works in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

        return res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        console.error("Create Order Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to create order"
        });
    }
});

// ================= VERIFY PAYMENT =================
// POST /api/payment/verify
router.post("/verify", async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            return res.status(200).json({
                success: true,
                message: "Payment verified successfully"
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid signature, payment failed"
            });
        }

    } catch (error) {
        console.error("Verify Payment Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Payment verification failed"
        });
    }
});

// ================= TEST ROUTE =================
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Payment route working 🚀"
    });
});

export default router;
