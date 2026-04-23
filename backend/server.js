const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const nodeRoutes = require("./routes/nodes");
const alertRoutes = require("./routes/alert");

dotenv.config();

const app = express();


// ================= SECURITY =================
app.use(helmet());


// ================= CORS FIX (IMPORTANT) =================
// TEMP: allow all origins (fixes "Failed to fetch")
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


// ================= RATE LIMIT =================
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later"
}));


// ================= BODY =================
app.use(express.json());


// ================= DEBUG LOGGER =================
app.use((req, res, next) => {
  console.log("REQ:", req.method, req.url);
  next();
});


// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api", alertRoutes);


// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({ status: "Server Running ✅" });
});


// ================= DB + SERVER =================
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log("🚀 Server running on port", PORT);
    });

  } catch (err) {
    console.error("❌ Server Error:", err.message);
    process.exit(1);
  }
};

startServer();
