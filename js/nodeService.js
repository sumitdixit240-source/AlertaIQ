// ======================
// BASE CONFIG
// ======================
const API_BASE = "https://alertaiq.onrender.com/api"; 
// 👉 PRODUCTION: replace with your backend URL
// const API_BASE = "https://your-backend.onrender.com/api";

// ======================
// TOKEN
// ======================
function getToken() {
    return localStorage.getItem("token");
}

// ======================
// AUTH HANDLER
// ======================
function handleAuthError(res) {
    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "index.html";
        return true;
    }
    return false;
}

// ======================
// CREATE NODE (ALERT)
// ======================
async function createNode(nodeData) {
    try {
        const res = await fetch(`${API_BASE}/alerts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            },
            body: JSON.stringify(nodeData)
        });

        const data = await res.json();

        if (handleAuthError(res)) return null;

        if (!res.ok) {
            console.error("Create error:", data);
            throw new Error(data.msg || "Create failed");
        }

        return data;

    } catch (err) {
        console.error("Create network error:", err);
        return null;
    }
}

// ======================
// GET ALL NODES
// ======================
async function getNodes() {
    try {
        const res = await fetch(`${API_BASE}/alerts`, {
            method: "GET",
            headers: {
                "Authorization": getToken()
            }
        });

        const data = await res.json();

        if (handleAuthError(res)) return [];

        if (!res.ok) {
            console.error("Fetch error:", data);
            return [];
        }

        return Array.isArray(data) ? data : (data.alerts || data.data || []);

    } catch (err) {
        console.error("Fetch network error:", err);
        return [];
    }
}

// ======================
// DELETE NODE
// ======================
async function deleteNode(id) {
    try {
        const res = await fetch(`${API_BASE}/alerts/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": getToken()
            }
        });

        const data = await res.json();

        if (handleAuthError(res)) return false;

        if (!res.ok) {
            console.error("Delete error:", data);
            return false;
        }

        return data.success === true;

    } catch (err) {
        console.error("Delete network error:", err);
        return false;
    }
}

// ======================
// CREATE PAYMENT ORDER (RAZORPAY)
// ======================
async function createPaymentOrder(freq) {
    try {
        const res = await fetch(`${API_BASE}/payment/create-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            },
            body: JSON.stringify({ freq })
        });

        const data = await res.json();

        if (handleAuthError(res)) return null;

        if (!res.ok) {
            throw new Error(data.message || "Payment order failed");
        }

        return data;

    } catch (err) {
        console.error("Payment order error:", err);
        return null;
    }
}

// ======================
// VERIFY PAYMENT
// ======================
async function verifyPayment(paymentData) {
    try {
        const res = await fetch(`${API_BASE}/payment/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            },
            body: JSON.stringify(paymentData)
        });

        const data = await res.json();

        if (handleAuthError(res)) return false;

        return data.success === true;

    } catch (err) {
        console.error("Payment verify error:", err);
        return false;
    }
}
