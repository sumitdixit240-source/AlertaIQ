const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // ================= GET AUTH HEADER =================
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization header provided",
      });
    }

    // ================= VALIDATE FORMAT =================
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format. Use Bearer token",
      });
    }

    // ================= EXTRACT TOKEN =================
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    // ================= VERIFY TOKEN =================
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // ================= ATTACH USER =================
    req.user = decoded; 
    // (recommended: contains id, email, role if you add it later)

    next();

  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Token expired or invalid",
    });
  }
};
