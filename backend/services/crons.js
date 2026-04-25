const cron = require("node-cron");
const Alert = require("../models/Alert");
const sendMail = require("./mailer");

// ================= INTERVAL MAPPING =================
const getIntervalMs = (freq) => {
  const map = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
    "one-time": null,
  };
  return map[freq] || null;
};

// ================= CRON JOB =================
// runs every minute
cron.schedule("* * * * *", async () => {
  console.log(`⏱ Cron started at ${new Date().toISOString()}`);

  const now = Date.now();

  try {
    // ❗ Only fetch required fields (performance improvement)
    const alerts = await Alert.find(
      {},
      "email title category amount frequency expiryDate lastSent reminderSent"
    );

    for (const alert of alerts) {
      try {
        if (!alert.expiryDate || !alert.email) continue;

        const expiryTime = new Date(alert.expiryDate).getTime();
        if (Number.isNaN(expiryTime)) continue;

        const diff = expiryTime - now;

        // ❌ already expired → skip
        if (diff <= 0) continue;

        const days = Math.floor(diff / (86400000));
        const hours = Math.floor((diff % 86400000) / 3600000);

        // ================= ONE-TIME ALERT =================
        if (alert.frequency === "one-time") {
          const reminderWindow = 3 * 86400000; // 3 days

          if (diff <= reminderWindow && !alert.reminderSent) {
            await sendMail(
              alert.email,
              "⚠️ Renewal Reminder",
              `
                <h2>${alert.title} Expiring Soon</h2>
                <p><b>Category:</b> ${alert.category}</p>
                <p><b>Amount:</b> ₹${alert.amount}</p>
                <p><b>Expiry:</b> ${new Date(expiryTime).toLocaleString()}</p>
                <h3>⏳ Time Left: ${days}d ${hours}h</h3>
              `
            );

            alert.reminderSent = true;
            alert.lastSent = new Date();
            await alert.save();

            console.log(`📩 One-time alert sent → ${alert.email}`);
          }

          continue;
        }

        // ================= RECURRING ALERT =================
        const interval = getIntervalMs(alert.frequency);
        if (!interval) continue;

        const lastSentTime = alert.lastSent
          ? new Date(alert.lastSent).getTime()
          : 0;

        const shouldSend = now - lastSentTime >= interval;

        if (shouldSend) {
          await sendMail(
            alert.email,
            "⏳ Renewal Alert",
            `
              <h2>${alert.title}</h2>
              <p><b>Category:</b> ${alert.category}</p>
              <p><b>Amount:</b> ₹${alert.amount}</p>
              <p><b>Frequency:</b> ${alert.frequency}</p>
              <p><b>Expiry:</b> ${new Date(expiryTime).toLocaleString()}</p>
              <h3>⏰ Time Left: ${days}d ${hours}h</h3>
            `
          );

          alert.lastSent = new Date();
          await alert.save();

          console.log(`📩 Recurring alert sent → ${alert.email}`);
        }

      } catch (err) {
        console.error(`⚠️ Alert error (${alert._id}):`, err.message);
      }
    }

    console.log("✅ Cron cycle completed");

  } catch (err) {
    console.error("❌ Cron job failed:", err.message);
  }
});