const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
require("./jobs/cron"); // IMPORTANT - start cron job

app.use("/api/auth", require("./routes/auth"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/alerts", require("./routes/alert"));

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("DB Connected"));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/alerts", require("./routes/alert"));

app.listen(5000, ()=>console.log("Server running"));