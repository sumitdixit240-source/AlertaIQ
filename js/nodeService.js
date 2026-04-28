// ======================
// BASE URL (FINAL CORRECT)
// ======================
const BASE = "https://alertaiq.onrender.com/api/nodes";

// ======================
// TOKEN
// ======================
function getToken() {
    const token = localStorage.getItem("token");
    console.log("🔑 TOKEN:", token);
    return token;
}

// ======================
// SAFE FETCH (IMPORTANT FIX)
// ======================
async function safeFetch(url, options = {}, retries = 2) {
    try {
        const res = await fetch(url, options);
        return res;
    } catch (err) {
        console.warn("⚠️ Network error, retrying...", err.message);

        if (retries > 0) {
            await new Promise(r => setTimeout(r, 2000));
            return safeFetch(url, options, retries - 1);
        }

        throw new Error("Network connection failed (server down or no internet)");
    }
}

// ======================
// HANDLE AUTH ERROR
// ======================
function handleAuthError(res, data) {
    if (res.status === 401 || res.status === 403) {
        console.warn("🚨 Auth error:", res.status);
        localStorage.removeItem("token");
        window.location.href = "index.html";
        return true;
    }
    return false;
}

// ======================
// CREATE NODE
// ======================
async function pushNodeToCloud(node) {
    console.log("📤 Sending node:", node);
    showOverlay("Connecting to Cloud...");

    try {
        const res = await safeFetch(`${BASE}/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                title: node.title,
                category: node.category,
                frequency: node.frequency,
                amount: Number(node.amount),
                expiryDate: new Date(node.expiryDate).toISOString()
            })
        });

        const data = await res.json();

        if (handleAuthError(res, data)) return null;

        if (!res.ok) {
            throw new Error(data.message || "Create failed");
        }

        console.log("✅ Node created:", data);

        await syncNodes();
        return data.data || data.node || data;

    } catch (err) {
        console.error("🔥 CREATE ERROR:", err.message);
        showError(err.message);
        return null;
    } finally {
        hideOverlay();
    }
}

// ======================
// GET ALL NODES
// ======================
async function syncNodes() {
    try {
        const res = await safeFetch(`${BASE}/all`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        const data = await res.json();

        if (handleAuthError(res, data)) return;

        if (!res.ok) throw new Error("Fetch failed");

        activeNodes = data.data || data.nodes || [];
        setNetworkStatus(true);
        renderUI();

    } catch (err) {
        console.error("🔥 FETCH ERROR:", err.message);
        setNetworkStatus(false);
        showError("Server offline or internet issue");
    }
}

// ======================
// DELETE NODE
// ======================
async function deleteNodeFromCloud(id) {
    try {
        const res = await safeFetch(`${BASE}/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        const data = await res.json();

        if (handleAuthError(res, data)) return null;

        if (!res.ok) throw new Error("Delete failed");

        await syncNodes();
        return true;

    } catch (err) {
        console.error("🔥 DELETE ERROR:", err.message);
        showError(err.message);
        return null;
    }
}
