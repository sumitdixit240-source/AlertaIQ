const cron = require("node-cron");
const Alert = require("../models/Alert");
const sendMail = require("./mailer");

const getIntervalMs = (freq) => {
  switch (freq) {
    case "1h": return 60 * 60 * 1000;
    case "6h": return 6 * 60 * 60 * 1000;
    case "12h": return 12 * 60 * 60 * 1000;
    case "24h": return 24 * 60 * 60 * 1000;
    case "Week": return 7 * 24 * 60 * 60 * 1000;
    case "Month": return 30 * 24 * 60 * 60 * 1000;
    case "Year": return 365 * 24 * 60 * 60 * 1000;
    default: return null;
  }
};

cron.schedule("* * * * *", async () => {
  console.log("⏱ Cron running...");

  const now = new Date();

  try {
    const alerts = await Alert.find({});

    for (let a of alerts) {
      const expiry = new Date(a.expiry);
      const diff = expiry - now;

      if (diff <= 0) continue;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

      // 🎯 3-day reminder
      if (a.frequency === "Once (3d Before)") {
        if (diff <= 3 * 24 * 60 * 60 * 1000 && !a.reminderSent) {

          await sendMail(
            a.email,
            "⚠️ Renewal Reminder",
            `
            <h2>${a.subCategory} Expiring Soon</h2>
            <p><b>Category:</b> ${a.category}</p>
            <p><b>Amount:</b> ₹${a.amount}</p>
            <p><b>Expiry:</b> ${expiry}</p>
            <h3>⏳ Time Left: ${days}d ${hours}h</h3>
            `
          );

          a.reminderSent = true;
          await a.save();
        }
        continue;
      }

      // 🎯 Regular frequency
      const interval = getIntervalMs(a.frequency);
      if (!interval) continue;

      if (!a.lastSent || (now - new Date(a.lastSent)) >= interval) {

        await sendMail(
          a.email,
          "⏳ Renewal Alert",
          `
          <h2>${a.subCategory}</h2>
          <p><b>Category:</b> ${a.category}</p>
          <p><b>Amount:</b> ₹${a.amount}</p>
          <p><b>Frequency:</b> ${a.frequency}</p>
          <p><b>Expiry:</b> ${expiry}</p>
          <h3>⏰ Time Left: ${days}d ${hours}h</h3>
          `
        );

        a.lastSent = now;
        await a.save();
      }
    }

  } catch (err) {
    console.error("❌ Cron error:", err);
  }
});