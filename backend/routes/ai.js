const express = require("express");
const router = express.Router();

/**
 * Simple AI endpoint (Gemini/OpenAI ready placeholder)
 * You can later connect Gemini API here
 */

// Health check
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AlertAIQ AI route working 🚀",
  });
});

/**
 * AI Suggestion Generator (mock version)
 * You can replace this with Gemini/OpenAI API later
 */
router.post("/suggest", async (req, res) => {
  try {
    const { service, category, amount, expiry } = req.body;

    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Service is required",
      });
    }

    // Simple smart suggestion logic (temporary AI engine)
    let suggestion = "";

    if (category === "Tax Related") {
      suggestion = `Pay your ${service} before due date to avoid penalty charges.`;
    } else if (category === "Billing Related") {
      suggestion = `Your ${service} bill of ₹${amount} should be monitored to avoid service interruption.`;
    } else if (category === "SaaS Subscriptions") {
      suggestion = `${service} subscription will expire on ${expiry}. Consider renewal early.`;
    } else {
      suggestion = `Monitor ${service} regularly to avoid disruption.`;
    }

    return res.json({
      success: true,
      input: req.body,
      aiSuggestion: suggestion,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("AI Route Error:", err);
    return res.status(500).json({
      success: false,
      message: "AI service error",
    });
  }
});

module.exports = router;
