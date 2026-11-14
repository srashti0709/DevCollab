
import prisma from "../config/prisma.js";
import { createGitHubInstallationOctokit } from "../config/githubApp.js";

const isValidRepositoryId = (repositoryId) =>
    typeof repositoryId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        repositoryId
    );

const isValidIssueNumber = (issueNumber) =>
    Number.isInteger(Number(issueNumber)) &&
    Number(issueNumber) > 0;

// Verify that the authenticated user can access the repository.
const findAccessibleRepository = async (repositoryId, userId) => {
    return prisma.repository.findFirst({
        where: {
            id: repositoryId,
            workspaceConnections: {
                some: {
                    workspace: {
                        members: {
                            some: {
                                userId,
                            },
                        },
                    },
                },
            },
        },
        include: {
            installation: {
                select: {
                    githubInstallationId: true,
                },
            },
        },
    });
};

// Save a GitHub issue for the authenticated user.
export const saveIssue = async (req, res) => {
    try {
        const { repositoryId, issueNumber } = req.params;

        if (!isValidRepositoryId(repositoryId)) {
            return res.status(400).json({
                success: false,
                message: "A valid repository ID is required.",
            });
        }

        if (!isValidIssueNumber(issueNumber)) {
            return res.status(400).json({
                success: false,
                message: "A valid issue number is required.",
            });
        }

        const parsedIssueNumber = Number(issueNumber);

        const repository = await findAccessibleRepository(
            repositoryId,
            req.userId
        );

        if (!repository) {
            return res.status(404).json({
                success: false,
                message: "Repository not found or you are not authorized to access it.",
            });
        }

        const [owner, repo] = repository.fullName.split("/");

        if (!owner || !repo) {
            return res.status(500).json({
                success: false,
                message: "Repository information is invalid.",
            });
        }

        const octokit = createGitHubInstallationOctokit(
            repository.installation.githubInstallationId.toString()
        );

        const { data: issue } = await octokit.rest.issues.get({
            owner,
            repo,
            issue_number: parsedIssueNumber,
        });

        if (issue.pull_request) {
            return res.status(400).json({
                success: false,
                message: "Pull requests cannot be saved as issues.",
            });
        }

        const savedIssue = await prisma.savedIssue.upsert({
            where: {
                userId_repositoryId_issueNumber: {
                    userId: req.userId,
                    repositoryId,
                    issueNumber: parsedIssueNumber,
                },
            },
            update: {
                githubIssueId: BigInt(issue.id),
                title: issue.title,
                state: issue.state.toUpperCase(),
                htmlUrl: issue.html_url,
            },
            create: {
                userId: req.userId,
                repositoryId,
                githubIssueId: BigInt(issue.id),
                issueNumber: parsedIssueNumber,
                title: issue.title,
                state: issue.state.toUpperCase(),
                htmlUrl: issue.html_url,
            },
            include: {
                repository: {
                    select: {
                        id: true,
                        name: true,
                        fullName: true,
                    },
                },
            },
        });

        return res.status(200).json({
            success: true,
            message: "Issue saved successfully.",
            savedIssue: {
                ...savedIssue,
                githubIssueId: savedIssue.githubIssueId.toString(),
            },
        });
    } catch (error) {
        console.error("Saving GitHub issue failed:", error.message);

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Issue not found in this repository.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to save this issue.",
        });
    }
};

// Remove a saved issue.
export const removeSavedIssue = async (req, res) => {
    try {
        const { repositoryId, issueNumber } = req.params;

        if (!isValidRepositoryId(repositoryId)) {
            return res.status(400).json({
                success: false,
                message: "A valid repository ID is required.",
            });
        }

        if (!isValidIssueNumber(issueNumber)) {
            return res.status(400).json({
                success: false,
                message: "A valid issue number is required.",
            });
        }

        const result = await prisma.savedIssue.deleteMany({
            where: {
                userId: req.userId,
                repositoryId,
                issueNumber: Number(issueNumber),
                repository: {
                    workspaceConnections: {
                        some: {
                            workspace: {
                                members: {
                                    some: {
                                        userId: req.userId,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (result.count === 0) {
            return res.status(404).json({
                success: false,
                message: "Saved issue not found or you are not authorized to access it.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Issue removed from saved issues successfully.",
        });
    } catch (error) {
        console.error("Removing saved issue failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to remove this saved issue.",
        });
    }
};

// Fetch the authenticated user's saved issues.
export const fetchSavedIssues = async (req, res) => {
    try {
        const savedIssues = await prisma.savedIssue.findMany({
            where: {
                userId: req.userId,
                repository: {
                    workspaceConnections: {
                        some: {
                            workspace: {
                                members: {
                                    some: {
                                        userId: req.userId,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            include: {
                repository: {
                    select: {
                        id: true,
                        name: true,
                        fullName: true,
                        htmlUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const issues = savedIssues.map((issue) => ({
            ...issue,
            githubIssueId: issue.githubIssueId.toString(),
        }));

        return res.status(200).json({
            success: true,
            totalCount: issues.length,
            issues,
        });
    } catch (error) {
        console.error("Fetching saved issues failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch saved issues.",
        });
    }
};
