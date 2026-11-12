
import prisma from "../config/prisma.js";

const requirePlatformRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required. Please log in.",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { platformRole: true },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User account not found.",
        });
      }

      if (!allowedRoles.includes(user.platformRole)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action.",
        });
      }

      req.user = {
        ...req.user,
        platformRole: user.platformRole,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default requirePlatformRole;
