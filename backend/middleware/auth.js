const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ================= TOKEN CHECK =================
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        msg: "Authorization token missing"
      });
    }

    const token = authHeader.split(" ")[1];

    // ================= VERIFY TOKEN =================
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ================= SAFE USER EXTRACTION =================
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({
        msg: "Invalid token payload"
      });
    }

    // ================= ATTACH USER =================
    req.user = {
      id: userId,
      email: decoded.email || null
    };

    // 🔒 OPTIONAL: prevent token tampering detection
    req.token = token;

    next();

  } catch (err) {
    // ================= EXPIRED TOKEN HANDLING =================
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        msg: "Token expired, please login again"
      });
    }

    return res.status(401).json({
      msg: "Invalid or corrupted token"
    });
  }
};
