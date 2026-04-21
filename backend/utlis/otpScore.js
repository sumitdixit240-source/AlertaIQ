const otpStore = new Map();

/*
Structure:
email => {
  otp: "1234",
  expiresAt: timestamp
}
*/

// Add OTP with 5 min expiry
otpStore.setOtp = (email, otp) => {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
};

// Verify OTP
otpStore.verifyOtp = (email, otp) => {
  const record = otpStore.get(email);

  if (!record) return { valid: false, message: "OTP not found" };

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: "OTP expired" };
  }

  if (record.otp !== otp) {
    return { valid: false, message: "Invalid OTP" };
  }

  otpStore.delete(email); // one-time use
  return { valid: true };
};

module.exports = otpStore;
