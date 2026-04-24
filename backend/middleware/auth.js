const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader =
      req.headers.authorization || req.headers.Authorization;

    // ================= HEADER CHECK =================
    if (!authHeader || typeof authHeader !== "string") {
      return res.status(401).json({
        error: "Authorization header missing"
      });
    }

    // ================= FORMAT CHECK =================
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        error: "Invalid authorization format"
      });
    }

    const token = parts[1];

    if (!token || token.trim() === "") {
      return res.status(401).json({
        error: "Token not found"
      });
    }

    // ================= VERIFY TOKEN =================
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        error: "Invalid token payload"
      });
    }

    // ================= ATTACH USER =================
    req.user = {
      id: decoded.id,
      email: decoded.email || null,
      role: decoded.role || "user",
      tokenVersion: decoded.tokenVersion || 0,
      sessionId: decoded.sessionId || null
    };

    req.token = token;

    next();

  } catch (err) {

    // ================= TOKEN EXPIRED =================
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired, please login again"
      });
    }

    // ================= INVALID TOKEN =================
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token"
      });
    }

    console.error("AUTH ERROR:", err.message);

    return res.status(500).json({
      error: "Authentication failed"
    });
  }
};