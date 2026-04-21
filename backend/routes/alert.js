import express from "express";
import OTP from "../models/otp.js";
import { sendEmailOTP } from "../services/mailer.js";

const router = express.Router();

// ================= TEST ROUTE =================
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Alert route working 🚀"
    });
});


// ================= CREATE ALERT =================
router.post("/create", async (req, res) => {
    try {
        const { title, message } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: "Title and message are required"
            });
        }

        // TODO: Save to MongoDB (next step)
        res.json({
            success: true,
            message: "Alert created successfully",
            data: { title, message }
        });

    } catch (error) {
        console.error("Alert Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to create alert"
        });
    }
});


// ================= SEND OTP =================
router.post("/send-otp", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);

        // save OTP in DB (auto expires if schema has expires)
        await OTP.create({ email, otp });

        // send OTP email
        await sendEmailOTP(email, otp);

        res.json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.log("OTP ERROR:", error);
        res.status(500).json({
            success: false,
            message: "OTP failed"
        });
    }
});


// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        const record = await OTP.findOne({ email, otp });

        if (!record) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // remove OTP after success
        await OTP.deleteMany({ email });

        res.json({
            success: true,
            message: "OTP verified successfully"
        });

    } catch (error) {
        console.log("VERIFY ERROR:", error);
        res.status(500).json({
            success: false,
            message: "OTP verification failed"
        });
    }
});

export default router;
