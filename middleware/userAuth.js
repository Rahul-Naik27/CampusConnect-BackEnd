const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader =
    req.headers.authorization || req.headers.Authorization || "";
  let token = null;
  if (
    typeof authHeader === "string" &&
    authHeader.toLowerCase().startsWith("bearer ")
  ) {
    token = authHeader.split(" ")[1];
  } else if (authHeader) {
    token = authHeader;
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token)
    return res.status(401).json({ message: "Authentication required" });

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing in environment");
  }
  const secret = process.env.JWT_SECRET;

  try {
    const payload = jwt.verify(token, secret);
    req.user = {
      id: payload.id,
      role: payload.role,
      name: payload.name,
      email: payload.email,
    };
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  next();
};

module.exports = { authenticateToken, requireAdmin };
