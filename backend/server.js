const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const nodeRoutes = require("./routes/nodes");
const alertRoutes = require("./routes/alert");

dotenv.config();

// ================= APP =================
const app = express();
const server = http.createServer(app);

// ================= SOCKET =================
const io = socketIo(server, {
  cors: {
    origin: true, // allow all (safe for dev + Vercel)
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ================= SECURITY =================
app.use(helmet());

// ================= CORS FIX =================
// ⚠️ IMPORTANT: DO NOT use complex origin check unless needed
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// ✅ FIX preflight (important for POST/PUT from Vercel)
app.options("*", cors());

// ================= RATE LIMIT =================
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  })
);

// ================= BODY PARSER =================
app.use(express.json());

// ================= LOG REQUESTS =================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/alerts", alertRoutes);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({ status: "🚀 AlertAIQ Server Running" });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({
    message: err.message || "Internal Server Error"
  });
});

// ================= START SERVER =================
async function startServer() {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("⚡ Socket.IO enabled");
    });

  } catch (err) {
    console.error("❌ DB ERROR:", err.message);
    process.exit(1);
  }
}

startServer();
