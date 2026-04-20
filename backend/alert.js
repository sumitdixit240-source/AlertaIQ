const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");

router.post("/create", async (req, res) => {
  const alert = await Alert.create(req.body);
  res.json(alert);
});

module.exports = router;