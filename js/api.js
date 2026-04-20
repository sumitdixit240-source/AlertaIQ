const BASE = "http://localhost:5000/api"; // change after deploy

export async function sendOTP(email) {
  return fetch(BASE + "/auth/send-otp", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ email })
  });
}

export async function createAlert(data) {
  return fetch(BASE + "/alerts/create", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  });
}
