
import prisma from "../config/prisma.js";
import { createGitHubInstallationOctokit } from "../config/githubApp.js";

export const fetchRepositoryPullRequests = async (req, res) => {
    try {
        const { repositoryId } = req.params;

        // Validate the repository ID.
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

        // Create an authenticated GitHub client for this installation.
        const octokit = createGitHubInstallationOctokit(
            repository.installation.githubInstallationId.toString()
        );

        // Fetch every page of pull requests from GitHub.
        const pullRequests = [];
        let page = 1;

        while (true) {
            const { data } = await octokit.rest.pulls.list({
                owner,
                repo,
                state: "all",
                per_page: 100,
                page,
                sort: "updated",
                direction: "desc",
            });

            for (const pullRequest of data) {
                pullRequests.push({
                    githubPrId: String(pullRequest.id),
                    number: pullRequest.number,
                    title: pullRequest.title,
                    body: pullRequest.body,
                    state: pullRequest.merged_at
                        ? "MERGED"
                        : pullRequest.state.toUpperCase(),
                    author: pullRequest.user?.login || null,
                    authorAvatar: pullRequest.user?.avatar_url || null,
                    requestedReviewers: (pullRequest.requested_reviewers || []).map(
                        (reviewer) => reviewer.login
                    ),
                    baseBranch: pullRequest.base?.ref || null,
                    headBranch: pullRequest.head?.ref || null,
                    isDraft: pullRequest.draft,
                    createdAt: pullRequest.created_at,
                    updatedAt: pullRequest.updated_at,
                    closedAt: pullRequest.closed_at,
                    mergedAt: pullRequest.merged_at,
                    htmlUrl: pullRequest.html_url,
                    comments: pullRequest.comments,
                    reviewComments: pullRequest.review_comments,
                    commits: pullRequest.commits,
                    additions: pullRequest.additions,
                    deletions: pullRequest.deletions,
                    changedFiles: pullRequest.changed_files,
                });
            }

            if (data.length < 100) {
                break;
            }

            page++;
        }

        return res.status(200).json({
            success: true,
            repository: {
                id: repository.id,
                name: repository.fullName,
            },
            totalCount: pullRequests.length,
            pullRequests,
        });
    } catch (error) {
        console.error("Fetching GitHub pull requests failed:", error.message);

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Pull requests or repository not found on GitHub.",
            });
        }

        if (error.status === 403 || error.status === 401) {
            return res.status(502).json({
                success: false,
                message: "GitHub App is not authorized to access this repository.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to fetch repository pull requests.",
        });
    }
};

export const fetchPullRequestDetails = async (req, res) => {
    try {
        const { repositoryId, pullRequestNumber } = req.params;

        // Validate repository ID and pull request number.
        if (
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repositoryId) ||
            !/^[1-9]\d*$/.test(pullRequestNumber)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid repository ID and pull request number are required.",
            });
        }

        // Verify repository access through workspace membership.
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

        // Authenticate using the repository's GitHub App installation.
        const octokit = createGitHubInstallationOctokit(
            repository.installation.githubInstallationId.toString()
        );

        // Fetch the requested pull request from GitHub.
        const { data: pullRequest } = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: Number(pullRequestNumber),
        });

        return res.status(200).json({
            success: true,
            repository: {
                id: repository.id,
                name: repository.fullName,
            },
            pullRequest: {
                githubPrId: String(pullRequest.id),
                number: pullRequest.number,
                title: pullRequest.title,
                body: pullRequest.body,
                state: pullRequest.merged_at
                    ? "MERGED"
                    : pullRequest.state.toUpperCase(),
                author: pullRequest.user?.login || null,
                authorAvatar: pullRequest.user?.avatar_url || null,
                baseBranch: pullRequest.base?.ref || null,
                headBranch: pullRequest.head?.ref || null,
                isDraft: pullRequest.draft,
                createdAt: pullRequest.created_at,
                updatedAt: pullRequest.updated_at,
                closedAt: pullRequest.closed_at,
                mergedAt: pullRequest.merged_at,
                htmlUrl: pullRequest.html_url,
                comments: pullRequest.comments,
                reviewComments: pullRequest.review_comments,
                commits: pullRequest.commits,
                additions: pullRequest.additions,
                deletions: pullRequest.deletions,
                changedFiles: pullRequest.changed_files,
            },
        });
    } catch (error) {
        console.error("Fetching GitHub pull request details failed:", error.message);

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Pull request or repository not found on GitHub.",
            });
        }

        if (error.status === 403 || error.status === 401) {
            return res.status(502).json({
                success: false,
                message: "GitHub App is not authorized to access this repository.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to fetch pull request details.",
        });
    }
};

export const fetchPullRequestReviews = async (req, res) => {
    try {
        const { repositoryId, pullRequestNumber } = req.params;

        if (
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repositoryId) ||
            !/^[1-9]\d*$/.test(pullRequestNumber)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid repository ID and pull request number are required.",
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

        const octokit = createGitHubInstallationOctokit(
            repository.installation.githubInstallationId.toString()
        );

        const reviews = [];
        let page = 1;

        while (true) {
            const { data } = await octokit.rest.pulls.listReviews({
                owner,
                repo,
                pull_number: Number(pullRequestNumber),
                per_page: 100,
                page,
            });

            reviews.push(...data);

            if (data.length < 100) {
                break;
            }

            page++;
        }

        return res.status(200).json({
            success: true,
            totalCount: reviews.length,
            reviews: reviews.map((review) => ({
                id: review.id,
                reviewer: review.user?.login || null,
                reviewerAvatar: review.user?.avatar_url || null,
                state: review.state,
                body: review.body,
                submittedAt: review.submitted_at,
                commitId: review.commit_id,
                htmlUrl: review.html_url,
            })),
        });
    } catch (error) {
        console.error("Fetching GitHub pull request reviews failed:", error.message);

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Pull request or repository not found on GitHub.",
            });
        }

        if (error.status === 403 || error.status === 401) {
            return res.status(502).json({
                success: false,
                message: "GitHub App is not authorized to access this repository.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to fetch pull request reviews.",
        });
    }
};

export const fetchPullRequestTimeline = async (req, res) => {
    try {
        const { repositoryId, pullRequestNumber } = req.params;

        if (
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repositoryId) ||
            !/^[1-9]\d*$/.test(pullRequestNumber)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid repository ID and pull request number are required.",
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

        // Verify that the requested pull request exists.
        await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: Number(pullRequestNumber),
        });

        // Fetch every page of pull request timeline events.
        const events = [];
        let page = 1;

        while (true) {
            const { data } = await octokit.request(
                "GET /repos/{owner}/{repo}/issues/{issue_number}/timeline",
                {
                    owner,
                    repo,
                    issue_number: Number(pullRequestNumber),
                    per_page: 100,
                    page,
                }
            );

            events.push(...data);

            if (data.length < 100) {
                break;
            }

            page++;
        }

        const timeline = events.map((event) => ({
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
            requestedReviewer: event.requested_reviewer?.login || null,
            requestedTeam: event.requested_team?.name || null,
            review: event.review
                ? {
                    state: event.review.state || null,
                    body: event.review.body || "",
                    htmlUrl: event.review.html_url || null,
                }
                : null,
            comment: event.issue_comment
                ? {
                    body: event.issue_comment.body || "",
                    htmlUrl: event.issue_comment.html_url || null,
                }
                : null,
        }));

        return res.status(200).json({
            success: true,
            pullRequestNumber: Number(pullRequestNumber),
            totalCount: timeline.length,
            timeline,
        });
    } catch (error) {
        console.error(
            "Fetching GitHub pull request timeline failed:",
            error.message
        );

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Pull request or repository not found on GitHub.",
            });
        }

        if (error.status === 403 || error.status === 401) {
            return res.status(502).json({
                success: false,
                message: "GitHub App is not authorized to access this repository.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to fetch pull request timeline.",
        });
    }
};

export const fetchPullRequestLinkedIssues = async (req, res) => {
    try {
        const { repositoryId, pullRequestNumber } = req.params;

        if (
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repositoryId) ||
            !/^[1-9]\d*$/.test(pullRequestNumber)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid repository ID and pull request number are required.",
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

        const { data: pullRequest } = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: Number(pullRequestNumber),
        });

        // Find GitHub closing references in the pull request description.
        const closingReferenceRegex =
            /\b(?:close[sd]?|fix(?:es|ed)?|resolve[sd]?)\s+#(\d+)\b/gi;

        

        const matchedIssueNumbers = [];
        let match;

        while ((match = closingReferenceRegex.exec(pullRequest.body || "")) !== null) {
            matchedIssueNumbers.push(Number(match[1]));
        }

        const uniqueIssueNumbers = [...new Set(matchedIssueNumbers)];

        // Fetch the actual issue details from GitHub.
        const linkedIssues = await Promise.all(
            uniqueIssueNumbers.map(async (issueNumber) => {
                try {
                    const { data: issue } = await octokit.rest.issues.get({
                        owner,
                        repo,
                        issue_number: issueNumber,
                    });

                    // Exclude pull requests returned by GitHub's Issues API.
                    if (issue.pull_request) {
                        return null;
                    }

                    return {
                        githubIssueId: String(issue.id),
                        number: issue.number,
                        title: issue.title,
                        state: issue.state.toUpperCase(),
                        author: issue.user?.login || null,
                        authorAvatar: issue.user?.avatar_url || null,
                        labels: (issue.labels || []).map((label) => ({
                            name: label.name,
                            color: label.color,
                        })),
                        createdAt: issue.created_at,
                        updatedAt: issue.updated_at,
                        closedAt: issue.closed_at,
                        htmlUrl: issue.html_url,
                    };
                } catch (error) {
                    // Ignore references that do not resolve to an accessible issue.
                    if (error.status === 404) {
                        return null;
                    }

                    throw error;
                }
            })
        );

        const validLinkedIssues = linkedIssues.filter(Boolean);

        return res.status(200).json({
            success: true,
            pullRequestNumber: Number(pullRequestNumber),
            totalCount: validLinkedIssues.length,
            linkedIssues: validLinkedIssues,
        });
    } catch (error) {
        console.error(
            "Fetching GitHub pull request linked issues failed:",
            error.message
        );

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Pull request or repository not found on GitHub.",
            });
        }

        if (error.status === 403 || error.status === 401) {
            return res.status(502).json({
                success: false,
                message: "GitHub App is not authorized to access this repository.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to fetch linked issues.",
        });
    }
};
