const { auth, db } = require('../config/firebase');

/**
 * Middleware: verifyToken
 * Verifies the Firebase ID token sent in Authorization header
 * Attaches decoded user info to req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    // Attach user info to request
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Middleware: requireRole
 * Checks if authenticated user has one of the allowed roles
 * Usage: requireRole('admin'), requireRole('driver', 'admin')
 */
const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Fetch user role from Firestore
      const userDoc = await db.collection('users').doc(req.user.uid).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found in database' });
      }

      const userData = userDoc.data();
      const userRole = userData.role;

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          error: `Forbidden: Requires role [${roles.join(' or ')}], got [${userRole}]`,
        });
      }

      // Attach full user data to request
      req.userRole = userRole;
      req.userData = userData;
      next();
    } catch (error) {
      console.error('Role check failed:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};

module.exports = { verifyToken, requireRole };
