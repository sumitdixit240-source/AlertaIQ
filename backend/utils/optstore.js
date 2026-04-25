const otpStore = new Map();

// auto cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();

  for (const [email, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 10 * 60 * 1000);

/**
 * email -> { otp, expiresAt }
 */

const setOTP = (email, otp) => {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
};

const getOTP = (email) => {
  const data = otpStore.get(email);

  if (!data) return null;

  if (Date.now() > data.expiresAt) {
    otpStore.delete(email);
    return null;
  }

  return data;
};

const deleteOTP = (email) => {
  otpStore.delete(email);
};

module.exports = {
  setOTP,
  getOTP,
  deleteOTP,
};