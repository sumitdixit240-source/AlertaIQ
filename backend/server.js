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

const app = express();


// ================= HTTP SERVER =================
const server = http.createServer(app);


// ================= SOCKET.IO =================
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // 🔁 Node update broadcast
  socket.on("nodeUpdated", (data) => {
    io.emit("refreshNodes", data);
  });

  // 🔔 Alert broadcast (optional but useful)
  socket.on("newAlert", (data) => {
    io.emit("refreshAlerts", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});


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

    // DEV MODE fallback
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));


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


// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


// ================= DB + SERVER START =================
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`⚡ Socket.IO enabled`);
    });

  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  }
};

startServer();