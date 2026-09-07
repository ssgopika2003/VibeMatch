import jwt from 'jsonwebtoken';

// Authentication middleware
export const auth = (required = true) => {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        if (required) {
          return res.status(401).json({
            success: false,
            message: 'No token, authorization denied'
          });
        }
        return next();
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
      
    } catch (error) {
      if (required) {
        res.status(401).json({
          success: false,
          message: 'Token is not valid'
        });
      } else {
        next();
      }
    }
  };
};

// Admin authorization middleware
export const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};
