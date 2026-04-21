const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.cjs");

dotenv.config();

const app = express();

// security
app.use(helmet());

app.use(cors({
  origin: "*"
}));

// rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// body
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);

// test route
app.get("/", (req, res) => {
  res.send("Server Running ✅");
});

const PORT = process.env.PORT || 5000;

// start
connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port", PORT);
  });
}).catch(err => {
  console.log("DB error:", err.message);
});
