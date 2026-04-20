const cron = require("node-cron");
const Alert = require("../models/Alert");
const { sendEmail } = require("../services/mailer");

// Runs every minute
cron.schedule("* * * * *", async () => {
  const now = new Date();

  const alerts = await Alert.find({
    nextRun: { $lte: now }
  });

  for (let alert of alerts) {
    await sendEmail(alert.email, "AlertAIQ Reminder", alert.message);

    alert.nextRun = new Date(Date.now() + alert.interval);
    await alert.save();
  }

  console.log("Cron executed ✔");
});
