const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
require("./jobs/cron"); // start cron jobs

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.send("AlertAIQ Backend Running 🚀");
});

/* ================= ROUTES ================= */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/razorpay", require("./routes/razorpay")); // FIXED (separate file)
app.use("/api/alerts", require("./routes/alert"));
app.use("/api/mailer", require("./routes/mailer"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/user", require("./routes/user"));
app.use("/api/otp", require("./routes/otp"));
app.use("/api/cron", require("./routes/cron"));
app.use("/api/generateOTP", require("./routes/generateOTP"));

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB Connected ✅"))
  .catch((err) => console.error("DB Connection Error ❌", err));

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
