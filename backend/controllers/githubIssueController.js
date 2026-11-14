
import prisma from "../config/prisma.js";
import { createGitHubInstallationOctokit } from "../config/githubApp.js";

export const fetchRepositoryIssues = async (req, res) => {
    try {
        const { repositoryId } = req.params;

        if (
            typeof repositoryId !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repositoryId)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid repository ID is required.",
            });
        }

        // Verify that the user belongs to a workspace connected to this repository.
        const repository = await prisma.repository.findFirst({
            where: {
                id: repositoryId,
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
            include: {
                installation: {
                    select: {
                        githubInstallationId: true,
                    },
                },
            },
        });

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

        const { data } = await octokit.rest.issues.listForRepo({
            owner,
            repo,
            state: "all",
            per_page: 100,
            page: 1,
        });

        // GitHub's Issues API also returns pull requests, so exclude them.
        const issues = data
            .filter((issue) => !issue.pull_request)
            .map((issue) => ({
                githubIssueId: String(issue.id),
                number: issue.number,
                title: issue.title,
                body: issue.body,
                state: issue.state,
                author: issue.user?.login || null,
                assignees: issue.assignees.map((assignee) => assignee.login),
                labels: issue.labels.map((label) => ({
                    id: label.id,
                    name: label.name,
                    color: label.color,
                    description: label.description,
                })),
                comments: issue.comments,
                createdAt: issue.created_at,
                updatedAt: issue.updated_at,
                closedAt: issue.closed_at,
                htmlUrl: issue.html_url,
            }));

        return res.status(200).json({
            success: true,
            repository: {
                id: repository.id,
                name: repository.fullName,
            },
            totalCount: issues.length,
            issues,
        });
    } catch (error) {
        console.error("Fetching GitHub issues failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch repository issues.",
        });
    }
};
export const fetchIssueDetails = async (req, res) => {
    try {
        const { repositoryId, issueNumber } = req.params;

        if (
            typeof repositoryId !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repositoryId)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid repository ID is required.",
            });
        }

        const parsedIssueNumber = Number(issueNumber);

        if (
            !Number.isInteger(parsedIssueNumber) ||
            parsedIssueNumber < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid issue number is required.",
            });
        }

        const repository = await prisma.repository.findFirst({
            where: {
                id: repositoryId,
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
            include: {
                installation: {
                    select: {
                        githubInstallationId: true,
                    },
                },
            },
        });

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
            return res.status(404).json({
                success: false,
                message: "Issue not found.",
            });
        }

        return res.status(200).json({
            success: true,
            repository: {
                id: repository.id,
                name: repository.fullName,
            },
            issue: {
                githubIssueId: String(issue.id),
                number: issue.number,
                title: issue.title,
                body: issue.body,
                state: issue.state,
                author: issue.user?.login || null,
                authorAvatar: issue.user?.avatar_url || null,
                assignees: issue.assignees.map((assignee) => ({
                    login: assignee.login,
                    avatarUrl: assignee.avatar_url,
                })),
                labels: issue.labels.map((label) => ({
                    id: label.id,
                    name: label.name,
                    color: label.color,
                    description: label.description,
                })),
                comments: issue.comments,
                createdAt: issue.created_at,
                updatedAt: issue.updated_at,
                closedAt: issue.closed_at,
                htmlUrl: issue.html_url,
                milestone: issue.milestone?.title || null,
            },
        });
    } catch (error) {
        console.error("Fetching GitHub issue details failed:", error.message);

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Issue not found in this repository.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to fetch issue details.",
        });
    }
};

export const fetchIssueTimeline = async (req, res) => {
    try {
        const { repositoryId, issueNumber } = req.params;

        if (
            typeof repositoryId !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repositoryId)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid repository ID is required.",
            });
        }

        const parsedIssueNumber = Number(issueNumber);

        if (!Number.isInteger(parsedIssueNumber) || parsedIssueNumber < 1) {
            return res.status(400).json({
                success: false,
                message: "A valid issue number is required.",
            });
        }

        const repository = await prisma.repository.findFirst({
            where: {
                id: repositoryId,
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
            include: {
                installation: {
                    select: {
                        githubInstallationId: true,
                    },
                },
            },
        });

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
            return res.status(404).json({
                success: false,
                message: "Issue not found.",
            });
        }

        const { data } = await octokit.request(
            "GET /repos/{owner}/{repo}/issues/{issue_number}/timeline",
            {
                owner,
                repo,
                issue_number: parsedIssueNumber,
                per_page: 100,
                page: 1,
            }
        );

        const timeline = data.map((event) => ({
            id: event.id,
            event: event.event,
            actor: event.actor?.login || null,
            actorAvatar: event.actor?.avatar_url || null,
            createdAt: event.created_at || null,
            assignee: event.assignee?.login || null,
            label: event.label?.name || null,
            labelColor: event.label?.color || null,
            rename: event.rename || null,
            milestone: event.milestone?.title || null,
            commitId: event.commit_id || null,
            comment: event.issue_comment
                ? {
                    body: event.issue_comment.body || "",
                    htmlUrl: event.issue_comment.html_url || null,
                }
                : null,
        }));

        return res.status(200).json({
            success: true,
            issueNumber: parsedIssueNumber,
            totalCount: timeline.length,
            timeline,
        });
    } catch (error) {
        console.error("Fetching GitHub issue timeline failed:", error.message);

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Issue not found in this repository.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to fetch issue timeline.",
        });
    }
};
