import express from "express";

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

export default router;
