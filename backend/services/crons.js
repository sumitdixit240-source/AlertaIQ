const cron = require("node-cron");
const Alert = require("../models/Alert");
const sendMail = require("./mailer");

// ================= INTERVAL MAPPING =================
const getIntervalMs = (freq) => {
  switch (freq) {
    case "daily": return 24 * 60 * 60 * 1000;
    case "weekly": return 7 * 24 * 60 * 60 * 1000;
    case "monthly": return 30 * 24 * 60 * 60 * 1000;
    case "one-time": return null;
    default: return null;
  }
};

// ================= CRON JOB =================
// Runs every minute
cron.schedule("* * * * *", async () => {
  console.log("⏱ Cron running...");

  const now = new Date();

  try {
    const alerts = await Alert.find({});

    for (let a of alerts) {
      try {
        const expiry = new Date(a.expiryDate);
        const diff = expiry - now;

        if (diff <= 0) continue;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

        // ================= ONE-TIME (3 DAY REMINDER) =================
        if (a.frequency === "one-time") {
          if (
            diff <= 3 * 24 * 60 * 60 * 1000 &&
            !a.reminderSent
          ) {
            await sendMail(
              a.email,
              "⚠️ Renewal Reminder",
              `
              <h2>${a.title} Expiring Soon</h2>
              <p><b>Category:</b> ${a.category}</p>
              <p><b>Amount:</b> ₹${a.amount}</p>
              <p><b>Expiry:</b> ${expiry.toLocaleString()}</p>
              <h3>⏳ Time Left: ${days}d ${hours}h</h3>
              `
            );

            a.reminderSent = true;
            await a.save();
          }
          continue;
        }

        // ================= RECURRING ALERT =================
        const interval = getIntervalMs(a.frequency);
        if (!interval) continue;

        if (!a.lastSent || (now - new Date(a.lastSent)) >= interval) {
          await sendMail(
            a.email,
            "⏳ Renewal Alert",
            `
            <h2>${a.title}</h2>
            <p><b>Category:</b> ${a.category}</p>
            <p><b>Amount:</b> ₹${a.amount}</p>
            <p><b>Frequency:</b> ${a.frequency}</p>
            <p><b>Expiry:</b> ${expiry.toLocaleString()}</p>
            <h3>⏰ Time Left: ${days}d ${hours}h</h3>
            `
          );

          a.lastSent = now;
          await a.save();
        }

      } catch (innerErr) {
        console.error("⚠️ Alert processing error:", innerErr.message);
      }
    }

  } catch (err) {
    console.error("❌ Cron error:", err.message);
  }
});
