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

app.use(cors({
  origin: "*", // TODO: restrict in production
  credentials: true
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later"
}));


// ================= BODY =================
app.use(express.json());


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
    if (connectDB) {
      await connectDB();
    } else {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB Connected (fallback)");
    }

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  }
};

startServer();
