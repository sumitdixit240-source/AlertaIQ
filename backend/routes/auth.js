import express from "express";

const router = express.Router();

// ================= TEST ROUTE =================
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Auth route working 🚀"
    });
});

// ================= REGISTER =================
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // TODO: add DB logic later
        res.json({
            success: true,
            message: "User registered successfully (demo)",
            user: { name, email }
        });

    } catch (error) {
        console.error("Auth Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password required"
            });
        }

        res.json({
            success: true,
            message: "Login successful (demo)"
        });

    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
});

export default router;
