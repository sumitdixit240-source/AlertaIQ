require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/auth");
const alertRoutes = require("./routes/alert");
const nodeRoutes = require("./routes/nodes");
const paymentRoutes = require("./routes/payment");

// Middleware
const errorMiddleware = require("./middleware/errorMiddleware");

// Cron Jobs
require("./services/crons");

const app = express();
const server = http.createServer(app);

// ================= TRUST PROXY (RENDER FIX) =================
app.set("trust proxy", 1);

// ================= SECURITY HEADERS =================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ================= CORS (SAFE + DEBUG FRIENDLY) =================
const allowedOrigins = new Set([
  "https://alertai-q.vercel.app",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      console.warn("🚫 CORS BLOCKED:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ================= HANDLE CORS ERRORS =================
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS blocked this request",
    });
  }
  next(err);
});

// ================= PRE-FLIGHT =================
app.options("*", cors());

// ================= BODY PARSER =================
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ================= SANITIZATION =================
app.use(mongoSanitize());

// ================= RATE LIMIT =================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many login attempts, try again later",
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

// ================= SOCKET.IO =================
const io = socketIo(server, {
  cors: {
    origin: Array.from(allowedOrigins),
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ Socket Connected:", socket.id);

  socket.on("join", (userId) => {
    if (typeof userId === "string" && userId.length > 0) {
      socket.join(userId);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id);
  });
});

// ================= REQUEST LOGGER =================
app.use((req, res, next) => {
  console.log(`➡ ${req.method} ${req.originalUrl}`);
  next();
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/payment", paymentRoutes);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({
    success: true,
    status: "🚀 AlertAIQ Running Secure Mode",
    uptime: process.uptime(),
    memory: process.memoryUsage().rss,
    time: new Date().toISOString(),
  });
});

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ================= GLOBAL ERROR HANDLER =================
app.use(errorMiddleware);

// ================= START SERVER SAFELY =================
async function startServer() {
  try {
    console.log("🔄 Connecting to DB...");

    await connectDB();

    console.log("✅ DB Connected");

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("🔐 Security Layer Active");
      console.log("🌍 CORS Protected");
    });

    // Graceful shutdown (important for Render)
    process.on("SIGTERM", () => {
      console.log("🛑 SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        process.exit(0);
      });
    });

  } catch (err) {
    console.error("❌ CRITICAL STARTUP ERROR:", err.message);
    process.exit(1);
  }
}

startServer();
