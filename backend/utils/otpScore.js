const otpStore = new Map();

// Save OTP
otpStore.setOtp = (email, otp) => {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 min
  });
};

// Verify OTP
otpStore.verifyOtp = (email, otp) => {
  const data = otpStore.get(email);

  if (!data) return { valid: false, message: "OTP not found" };

  if (Date.now() > data.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: "OTP expired" };
  }

  if (data.otp !== otp) {
    return { valid: false, message: "Invalid OTP" };
  }

  otpStore.delete(email);
  return { valid: true };
};

module.exports = otpStore;
