const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const nodeRoutes = require("./routes/nodes");
const alertRoutes = require("./routes/alert");

dotenv.config();

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

// ================= CORS (FIXED PRODUCTION VERSION) =================
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
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ IMPORTANT: Handle preflight requests
app.options("*", cors());

// ================= BODY PARSER =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= DATA SANITIZATION =================
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

// ================= GLOBAL RATE LIMIT =================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later.",
});

app.use("/api", limiter);

// ================= OTP / AUTH RATE LIMIT =================
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: "Too many OTP requests. Please wait a moment.",
});

app.use("/api/auth", authLimiter);

// ================= REQUEST LOGGER =================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/alerts", alertRoutes);

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

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err.message);

  res.status(500).json({
    message: "Internal Server Error",
  });
});

// ================= START SERVER =================
async function startServer() {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("🔐 Security: ENABLED");
      console.log("🌍 CORS FIXED");
    });
  } catch (err) {
    console.error("❌ DB CONNECTION ERROR:", err.message);
    process.exit(1);
  }
}

startServer();
