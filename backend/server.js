const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Cron job (must exist or comment it if missing)
try {
  require("./jobs/cron");
} catch (err) {
  console.log("Cron not loaded");
}

const app = express(); // ✅ MUST BE FIRST

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());

// ---------------- DATABASE ----------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB Connected"))
  .catch(err => console.log("DB Error:", err));

// ---------------- ROUTES ----------------
// IMPORTANT: ALL routes must export express.Router()

const authRoute = require("./routes/auth");
const paymentRoute = require("./routes/payment");
const alertRoute = require("./routes/alert");
const mailerRoute = require("./services/mailer");
const aiRoute = require("./routes/ai");
const userRoute = require("./routes/User");
const otpRoute = require("./routes/otp");

// Razorpay OPTIONAL (only if file exists)
let razorpayRoute;
try {
  razorpayRoute = require("./routes/razorpay");
} catch (e) {
  console.log("Razorpay route missing - skipping");
}

// ---------------- USE ROUTES ----------------
app.use("/api/auth", authRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/alerts", alertRoute);
app.use("/api/mailer", mailerRoute);
app.use("/api/ai", aiRoute);
app.use("/api/user", userRoute);
app.use("/api/otp", otpRoute);

if (razorpayRoute) {
  app.use("/api/razorpay", razorpayRoute);
}

// ---------------- TEST ----------------
app.get("/", (req, res) => {
  res.send("AlertAIQ Backend Running 🚀");
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});


