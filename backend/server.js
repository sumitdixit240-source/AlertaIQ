const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const nodeRoutes = require("./routes/nodes");
const alertRoutes = require("./routes/alert");

dotenv.config();

const app = express();


// ================= SECURITY =================
app.use(helmet());


// ================= CORS =================
const allowedOrigins = [
  "http://localhost:5000",
  "https://alertai-q.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked CORS request from:", origin);

    // TEMP DEV MODE (you can remove later)
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// ✅ FIX: apply cors ONLY ONCE
app.use(cors(corsOptions));


// ❌ REMOVED (this was causing Render crash)
// app.options("*", cors(corsOptions));


// ================= RATE LIMIT =================
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later"
}));


// ================= BODY PARSER =================
app.use(express.json());


// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/alert", alertRoutes);


// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({ status: "Server Running ✅" });
});


// ================= 404 HANDLER (SAFE FIX) =================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


// ================= DB + SERVER START =================
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  }
};

startServer();
