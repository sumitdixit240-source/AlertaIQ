require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");

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

app.set("trust proxy", 1);

// ================= DB =================
connectDB();

// ================= SECURITY =================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ================= CORS FIX (IMPORTANT) =================
const allowedOrigins = [
  "https://alertai-q.vercel.app",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.includes("vercel.app")
      ) {
        return callback(null, true);
      }

      console.log("🚫 CORS BLOCKED:", origin);
      return callback(new Error("CORS not allowed"), false);
    },
    credentials: true,
  })
);

// ================= MIDDLEWARE =================
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(cookieParser());

// ================= RATE LIMIT =================
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
      success: false,
      message: "Too many requests, try again later.",
    },
  })
);

// ================= SOCKET =================
const io = socketIo(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ Socket Connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id);
  });
});

// ================= LOGGING =================
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.originalUrl}`);
  next();
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/payment", paymentRoutes);

// ================= HEALTH =================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AlertAIQ Backend Running 🚀",
  });
});

// ================= 404 =================
app.use((req, res) => {
  console.log("❌ 404:", req.originalUrl);

  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ================= ERROR =================
app.use(errorMiddleware);

// ================= START =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
