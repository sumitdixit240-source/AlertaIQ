import express from "express";

const router = express.Router();

// ================= TEST ROUTE =================
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "AI route working 🚀"
    });
});

// Example AI endpoint
router.post("/generate", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required"
            });
        }

        // Placeholder AI response (replace later with OpenAI if needed)
        const response = `AI Response for: ${prompt}`;

        res.json({
            success: true,
            response
        });

    } catch (error) {
        console.error("AI Error:", error.message);
        res.status(500).json({
            success: false,
            message: "AI processing failed"
        });
    }
});

export default router;