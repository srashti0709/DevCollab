
import { Router } from "express";
import requireAuth from "../middleware/authMiddleware.js";

import {
    startGitHubInstallation,
    handleGitHubInstallationCallback,
} from "../controllers/githubInstallationController.js";

import {
    fetchAvailableRepositories,
    getPersonalWorkspace,
    connectRepository,
} from "../controllers/githubRepositoryController.js";

const router = Router();

router.get(
    "/installations/start",
    requireAuth,
    startGitHubInstallation
);

router.get(
    "/installations/setup",
    handleGitHubInstallationCallback
);

router.get(
    "/workspace/personal",
    requireAuth,
    getPersonalWorkspace
);

router.get(
    "/repositories/available",
    requireAuth,
    fetchAvailableRepositories
);

// Connect a GitHub repository to a workspace.
router.post(
    "/workspaces/:workspaceId/repositories",
    requireAuth,
    connectRepository
);

export default router;
