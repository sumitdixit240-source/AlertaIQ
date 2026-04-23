const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Accept: Bearer TOKEN
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      msg: "No token, authorization denied"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // =========================
    // SAFE NORMALIZATION LAYER
    // =========================
    req.user = {
      id: decoded.id || decoded._id,   // 🔒 supports both versions
      email: decoded.email || null
    };

    // optional debug-safe fallback (won't break anything)
    if (!req.user.id) {
      return res.status(401).json({
        msg: "Invalid token payload"
      });
    }

    next();

  } catch (err) {
    return res.status(401).json({
      msg: "Invalid token"
    });
  }
};
