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

    // 🔒 SAFE NORMALIZATION (supports old + new tokens)
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({
        msg: "Invalid token payload"
      });
    }

    req.user = {
      id: userId,
      email: decoded.email || null
    };

    next(); // ✅ REQUIRED (prevents "next is not a function")

  } catch (err) {
    return res.status(401).json({
      msg: "Invalid token"
    });
  }
};
