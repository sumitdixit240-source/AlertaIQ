const otpStore = new Map();

// ================= CONFIG =================
const OTP_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 20; // 🔥 UPDATED FROM 5 → 20

// ================= AUTO CLEANUP =================
setInterval(() => {
  try {
    const now = Date.now();

    for (const [email, data] of otpStore.entries()) {
      if (!data || data.expiresAt < now) {
        otpStore.delete(email);
      }
    }
  } catch (err) {
    console.error("OTP Cleanup Error:", err.message);
  }
}, CLEANUP_INTERVAL);

// ================= SET OTP =================
const setOTP = (email, otp) => {
  if (!email || !otp) return;

  const existing = otpStore.get(email);

  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_TIME,
    attempts: 0,
    createdAt: Date.now(),
    resendCount: (existing?.resendCount || 0) + 1,
  });
};

// ================= GET OTP =================
const getOTP = (email) => {
  if (!email) return null;

  const data = otpStore.get(email);

  if (!data) return null;

  if (Date.now() > data.expiresAt) {
    otpStore.delete(email);
    return null;
  }

  return data;
};

// ================= VERIFY OTP =================
const verifyOTP = (email, inputOtp) => {
  const data = otpStore.get(email);

  if (!data) return { success: false, message: "OTP not found" };

  if (Date.now() > data.expiresAt) {
    otpStore.delete(email);
    return { success: false, message: "OTP expired" };
  }

  // brute-force protection (20 attempts)
  if (data.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(email);
    return {
      success: false,
      message: "Too many attempts. OTP blocked.",
    };
  }

  if (data.otp !== inputOtp) {
    data.attempts += 1;
    otpStore.set(email, data);

    return {
      success: false,
      message: "Invalid OTP",
      attemptsLeft: MAX_ATTEMPTS - data.attempts,
    };
  }

  // success → delete OTP
  otpStore.delete(email);

  return {
    success: true,
    message: "OTP verified successfully",
  };
};

// ================= DELETE OTP =================
const deleteOTP = (email) => {
  if (!email) return;
  otpStore.delete(email);
};

module.exports = {
  setOTP,
  getOTP,
  verifyOTP,
  deleteOTP,
};
