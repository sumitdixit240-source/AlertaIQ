const jwt = require("jsonwebtoken");

/**
 * AlertAIQ Auth Middleware
 * - Supports: Authorization: Bearer <token>
 * - Compatible with frontend safeFetch()
 * - Clean error structure for UI toast handling
 */

module.exports = (req, res, next) => {
  try {
    // ================= GET TOKEN =================
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;

    let token = null;

    // Priority: Header > Cookie
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (cookieToken) {
      token = cookieToken;
    }

    // ================= NO TOKEN =================
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. Please login again.",
      });
    }

    // ================= VERIFY TOKEN =================
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    // ================= ATTACH USER =================
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();

  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.message);

    // ================= EXPIRED TOKEN HANDLING =================
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed. Invalid token.",
    });
  }
};
