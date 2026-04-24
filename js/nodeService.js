const BASE = "https://alertai-q.vercel.app/api";

// ======================
// GET TOKEN
// ======================
function getToken() {
    return localStorage.getItem("token");
}

// ======================
// CREATE NODE
// ======================
async function pushNodeToCloud(node) {
    try {
        const res = await fetch(BASE + "/nodes/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + getToken()
            },
            body: JSON.stringify(node)
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Create error:", data);
            return null;
        }

        return data._id || data.id;
    } catch (err) {
        console.error("Network error:", err);
        return null;
    }
}

// ======================
// GET ALL NODES
// ======================
async function getNodesFromCloud() {
    try {
        const res = await fetch(BASE + "/nodes/all", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + getToken()
            }
        });

        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

// ======================
// DELETE NODE
// ======================
async function deleteNodeFromCloud(id) {
    try {
        const res = await fetch(BASE + "/nodes/delete/" + id, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + getToken()
            }
        });

        return await res.json();
    } catch (err) {
        console.error(err);
        return null;
    }
}