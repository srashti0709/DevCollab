
import { Router } from "express";
import requireAuth from "../middleware/authMiddleware.js";

import {
  startGithubOAuth,
  handleGithubCallback,
  getCurrentUser,
  logout,
  updateProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
  getActiveSessions,
  revokeSession,
  revokeOtherSessions,
  deleteAccount,
} from "../controllers/authController.js";

const router = Router();

// GitHub OAuth routes (public)
router.get("/github", startGithubOAuth);
router.get("/github/callback", handleGithubCallback);

// Authenticated user routes
router.get("/me", requireAuth, getCurrentUser);
router.post("/logout", requireAuth, logout);
router.patch("/profile", requireAuth, updateProfile);

// Notification preferences
router.get("/notification-preferences", requireAuth, getNotificationPreferences);
router.patch("/notification-preferences", requireAuth, updateNotificationPreferences);

// Session management
router.get("/sessions", requireAuth, getActiveSessions);
router.delete("/sessions", requireAuth, revokeOtherSessions);
router.delete("/sessions/:sessionId", requireAuth, revokeSession);

// Account management
router.delete("/account", requireAuth, deleteAccount);

export default router;
