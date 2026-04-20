const axios = require("axios");

exports.getPrediction = async (alert, userStats) => {

  const res = await axios.post("http://localhost:8000/predict", {
    amount: alert.amount,
    days_left: userStats.daysLeft,
    missed_count: userStats.missed,
    avg_delay: userStats.avgDelay
  });

  return res.data;
};
