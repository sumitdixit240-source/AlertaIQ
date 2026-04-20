const express = require("express");
const cors = require("cors");

const auth = require("./routes/auth");
const alerts = require("./routes/alerts");
const payments = require("./routes/payments");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", auth);
app.use("/api/alerts", alerts);
app.use("/api/payments", payments);

module.exports = app;