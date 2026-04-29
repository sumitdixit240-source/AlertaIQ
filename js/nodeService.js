const BASE = "https://alertai-q.vercel.app/api/nodes";

// ======================
// TOKEN
// ======================
function getToken() {
    return localStorage.getItem("token");
}

// ======================
// HANDLE AUTH ERROR (IMPORTANT)
// ======================
function handleAuthError(res, data) {
    if (res.status === 401 || res.status === 403) {
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
    try {
        const res = await fetch(`${BASE}/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify(node)
        });

        const data = await res.json();

        if (handleAuthError(res, data)) return null;

        if (!res.ok) {
            console.error("Create error:", data);
            throw new Error(data.message || data.error || "Create failed");
        }

        // backend flexible response handling
        return data.data || data.node || data._id || data.id || data;

    } catch (err) {
        console.error("Create network error:", err);
        return null;
    }
}

// ======================
// GET ALL NODES
// ======================
async function getNodesFromCloud() {
    try {
        const res = await fetch(`${BASE}/all`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        const data = await res.json();

        if (handleAuthError(res, data)) return [];

        if (!res.ok) {
            console.error("Fetch error:", data);
            return [];
        }

        // SAFE BACKEND COMPATIBILITY
        return data.data || data.nodes || data.result || [];

    } catch (err) {
        console.error("Fetch network error:", err);
        return [];
    }
}

// ======================
// DELETE NODE
// ======================
async function deleteNodeFromCloud(id) {
    try {
        const res = await fetch(`${BASE}/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        const data = await res.json();

        if (handleAuthError(res, data)) return null;

        if (!res.ok) {
            console.error("Delete error:", data);
            return null;
        }

        return data.success ? true : data;

    } catch (err) {
        console.error("Delete network error:", err);
        return null;
    }
}
