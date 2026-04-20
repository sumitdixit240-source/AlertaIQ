const cron = require("node-cron");
const Alert = require("../backend/models/Alert");
const axios = require("axios");

cron.schedule("* * * * *", async () => {

  const alerts = await Alert.find();

  for (let a of alerts) {

    const daysLeft =
      (new Date(a.expiry) - new Date()) / (1000 * 60 * 60 * 24);

    // CALL AI SERVICE
    const ai = await axios.post("http://localhost:8000/analyze", {
      amount: a.amount,
      days_left: daysLeft
    });

    console.log("AI RESPONSE:", ai.data);

    // HERE YOU SEND WHATSAPP + EMAIL
  }

});
