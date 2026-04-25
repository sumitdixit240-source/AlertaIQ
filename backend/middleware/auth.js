const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 🔐 Check Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization required" });
    }

    const token = authHeader.split(" ")[1];

    // 🔐 Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // 🔐 Fetch user from DB (security check)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // 🔐 Token version check (forces logout after password change / logout all sessions)
    if (
      decoded.tokenVersion !== undefined &&
      user.tokenVersion !== decoded.tokenVersion
    ) {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }

    // ✅ Attach user to request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role || "user",
    };

    next();
  } catch (err) {
    // 🔐 Token expired handling
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Unauthorized access" });
  }
};
