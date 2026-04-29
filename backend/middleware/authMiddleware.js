const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    let token = req.headers.authorization;

    // ================= CHECK TOKEN =================
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, access denied",
      });
    }

    // ================= BEARER HANDLING =================
    if (typeof token === "string" && token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    // ================= VERIFY TOKEN =================
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // safer fallback check
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // attach user id
    req.user = decoded.id;

    next();

  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
