
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
    fetchConnectedRepositories,
    fetchRepositoryDetails,
    compareRepositories,
} from "../controllers/githubRepositoryController.js";

import {
    addRepositoryFavorite,
    removeRepositoryFavorite,
    fetchRepositoryFavorites,
} from "../controllers/repositoryFavoriteController.js";

import {
    fetchRepositoryIssues,
    fetchIssueDetails,
    fetchIssueTimeline,
} from "../controllers/githubIssueController.js";

import {
    saveIssue,
    removeSavedIssue,
    fetchSavedIssues,
} from "../controllers/savedIssueController.js";

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

// List the authenticated user's favorite repositories.
router.get(
    "/repositories/favorites",
    requireAuth,
    fetchRepositoryFavorites
);

// Add a repository to favorites.
router.post(
    "/repositories/:repositoryId/favorite",
    requireAuth,
    addRepositoryFavorite
);

// Remove a repository from favorites.
router.delete(
    "/repositories/:repositoryId/favorite",
    requireAuth,
    removeRepositoryFavorite
);

// Compare 2 to 4 connected repositories.
router.get(
    "/repositories/compare",
    requireAuth,
    compareRepositories
);

// Fetch the authenticated user's saved issues.
router.get(
    "/issues/saved",
    requireAuth,
    fetchSavedIssues
);

// Save a GitHub issue.
router.post(
    "/repositories/:repositoryId/issues/:issueNumber/save",
    requireAuth,
    saveIssue
);

// Remove a saved GitHub issue.
router.delete(
    "/repositories/:repositoryId/issues/:issueNumber/save",
    requireAuth,
    removeSavedIssue
);

// Fetch issues from a connected GitHub repository.
router.get(
    "/repositories/:repositoryId/issues",
    requireAuth,
    fetchRepositoryIssues
);

// Fetch activity timeline of a GitHub issue.
router.get(
    "/repositories/:repositoryId/issues/:issueNumber/timeline",
    requireAuth,
    fetchIssueTimeline
);

// Fetch details of a specific GitHub issue.
router.get(
    "/repositories/:repositoryId/issues/:issueNumber",
    requireAuth,
    fetchIssueDetails
);

// Retrieve repository details.
router.get(
    "/repositories/:repositoryId",
    requireAuth,
    fetchRepositoryDetails
);

// List repositories connected to a workspace.
router.get(
    "/workspaces/:workspaceId/repositories",
    requireAuth,
    fetchConnectedRepositories
);

// Connect a GitHub repository to a workspace.
router.post(
    "/workspaces/:workspaceId/repositories",
    requireAuth,
    connectRepository
);

export default router;
