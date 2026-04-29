require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

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

// ================= SECURITY =================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ================= CORS =================
const allowedOrigins = [
  "https://alertai-q.vercel.app",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(null, false);
      }
    },
    credentials: true,
  })
);

// ================= PREFLIGHT FIX =================
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ================= BODY PARSER =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= SANITIZATION =================
app.use(mongoSanitize());
app.use(xss());

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
    if (userId && typeof userId === "string") {
      socket.join(userId);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id);
  });
});

// ================= RATE LIMIT =================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api", limiter);

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
});
app.use("/api/auth", authLimiter);

// ================= LOGGER =================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
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
    status: "🚀 AlertAIQ Running Secure Mode",
    time: new Date().toISOString(),
  });
});

// ================= 404 =================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ================= ERROR HANDLER =================
app.use(errorMiddleware);

// ================= START SERVER =================
async function startServer() {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
      console.log("🔐 Security Enabled");
      console.log("🌍 CORS Configured");
    });
  } catch (err) {
    console.error("❌ DB ERROR:", err.message);
    process.exit(1);
  }
}

startServer();