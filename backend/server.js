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

// 🔥 optional: use in routes later
app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("nodeUpdated", (data) => {
    io.emit("refreshNodes", data);
  });

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

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked CORS:", origin);
    return callback(null, true); // keep open for now
  },
  credentials: true
}));


// ================= RATE LIMIT =================
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));


// ================= BODY =================
app.use(express.json());


// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/alert", alertRoutes);


// ================= HEALTH =================
app.get("/", (req, res) => {
  res.json({ status: "Server Running ✅" });
});


// ================= 404 =================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


// ================= START SERVER =================
async function startServer() {
  try {
    await connectDB(); // ✅ allowed here

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
