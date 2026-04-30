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

// ================= TRUST PROXY =================
app.set("trust proxy", 1);

// ================= SECURITY HEADERS =================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ================= ALLOWED ORIGINS =================
const allowedOrigins = [
  "https://alertai-q.vercel.app",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

// ================= CORS FIX (IMPORTANT) =================
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("🚫 CORS BLOCKED:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ================= HANDLE PREFLIGHT =================
app.options("*", cors());

// ================= BODY PARSER =================
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ================= SANITIZATION =================
app.use(mongoSanitize());

// ================= RATE LIMIT =================
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many requests, try again later",
  })
);

// ================= SOCKET.IO =================
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ Socket Connected:", socket.id);

  socket.on("join", (userId) => {
    if (typeof userId === "string") {
      socket.join(userId);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id);
  });
});

// ================= LOG REQUESTS =================
app.use((req, res, next) => {
  console.log(`➡ ${req.method} ${req.originalUrl}`);
  next();
});

// ================= ROUTES (IMPORTANT PART) =================
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

// ================= ERROR HANDLER =================
app.use(errorMiddleware);

// ================= START SERVER =================
async function startServer() {
  try {
    console.log("🔄 Connecting to DB...");
    await connectDB();
    console.log("✅ DB Connected");

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("🔐 Security Layer Active");
      console.log("🌍 Production Ready");
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("🛑 SIGTERM received...");
      server.close(() => process.exit(0));
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err.message);
    process.exit(1);
  }
}

startServer();
