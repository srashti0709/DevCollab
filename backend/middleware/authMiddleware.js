
const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
  }

  req.userId = req.session.userId;

  next();
};

export default requireAuth;
