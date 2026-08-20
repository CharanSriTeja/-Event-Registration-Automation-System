const jwt = require('jsonwebtoken');

/**
 * Middleware that accepts JWTs with role 'admin' OR 'volunteer'.
 * Used to protect volunteer-facing endpoints (e.g. scan).
 */
const volunteerAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (decoded.role !== 'admin' && decoded.role !== 'volunteer') {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = volunteerAuth;
