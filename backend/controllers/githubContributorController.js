
import prisma from "../config/prisma.js";
import { createGitHubInstallationOctokit } from "../config/githubApp.js";

export const fetchRepositoryContributors = async (req, res) => {
    try {
        const { repositoryId } = req.params;

        // Validate repository ID.
        if (
            typeof repositoryId !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repositoryId)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid repository ID is required.",
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

        // Fetch all contributor pages from GitHub.
        const contributors = [];
        let page = 1;

        while (true) {
            const { data } = await octokit.rest.repos.listContributors({
                owner,
                repo,
                per_page: 100,
                page,
                anon: true,
            });

            contributors.push(...data);

            if (data.length < 100) {
                break;
            }

            page++;
        }

        // Normalize contributor information.
        const normalizedContributors = contributors.map((contributor) => ({
            githubUserId: contributor.id ? String(contributor.id) : null,
            username: contributor.login || contributor.name || "Anonymous",
            avatarUrl: contributor.avatar_url || null,
            contributions: contributor.contributions || 0,
            profileUrl: contributor.html_url || null,
            type: contributor.type || "Anonymous",
        }));

        return res.status(200).json({
            success: true,
            repository: {
                id: repository.id,
                name: repository.fullName,
            },
            totalCount: normalizedContributors.length,
            contributors: normalizedContributors,
        });
    } catch (error) {
        console.error(
            "Fetching GitHub repository contributors failed:",
            error.message
        );

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Contributors or repository not found on GitHub.",
            });
        }

        if (error.status === 403 || error.status === 401) {
            return res.status(502).json({
                success: false,
                message: "GitHub App is not authorized to access this repository or its contributors.",
            });
        }

        if (error.status === 422) {
            return res.status(422).json({
                success: false,
                message: "GitHub could not process the contributor request.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to fetch repository contributors.",
        });
    }
};

export const fetchContributorProfile = async (req, res) => {
    try {
        const { repositoryId, username } = req.params;

        if (
            typeof repositoryId !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repositoryId)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid repository ID is required.",
            });
        }

        if (
            typeof username !== "string" ||
            !/^[a-zA-Z0-9-]{1,39}$/.test(username)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid GitHub username is required.",
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

        const octokit = createGitHubInstallationOctokit(
            repository.installation.githubInstallationId.toString()
        );

        const { data } = await octokit.rest.users.getByUsername({
            username,
        });

        const profile = {
            githubUserId: String(data.id),
            username: data.login,
            name: data.name,
            avatarUrl: data.avatar_url,
            profileUrl: data.html_url,
            bio: data.bio,
            company: data.company,
            location: data.location,
            blog: data.blog,
            twitterUsername: data.twitter_username,
            publicRepositories: data.public_repos,
            publicGists: data.public_gists,
            followers: data.followers,
            following: data.following,
            accountCreatedAt: data.created_at,
            accountUpdatedAt: data.updated_at,
            type: data.type,
            hireable: data.hireable,
        };

        return res.status(200).json({
            success: true,
            repository: {
                id: repository.id,
                name: repository.fullName,
            },
            profile,
        });
    } catch (error) {
        console.error(
            "Fetching GitHub contributor profile failed:",
            error.message
        );

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "GitHub contributor profile not found.",
            });
        }

        if (error.status === 403 || error.status === 401) {
            return res.status(502).json({
                success: false,
                message: "GitHub App is not authorized to fetch this profile.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to fetch contributor profile.",
        });
    }
};

export const fetchContributionStatistics = async (req, res) => {
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

        const contributors = [];
        let page = 1;

        while (true) {
            const { data } = await octokit.rest.repos.listContributors({
                owner,
                repo,
                per_page: 100,
                page,
                anon: true,
            });

            contributors.push(...data);

            if (data.length < 100) {
                break;
            }

            page++;
        }

        const contributorStatistics = contributors.map((contributor) => ({
            githubUserId: contributor.id ? String(contributor.id) : null,
            username: contributor.login || contributor.name || "Anonymous",
            contributions: contributor.contributions || 0,
            percentage: 0,
        }));

        const totalCommits = contributorStatistics.reduce(
            (total, contributor) => total + contributor.contributions,
            0
        );

        contributorStatistics.forEach((contributor) => {
            contributor.percentage =
                totalCommits > 0
                    ? Number(
                        ((contributor.contributions / totalCommits) * 100).toFixed(2)
                    )
                    : 0;
        });

        const commitCounts = contributorStatistics.map(
            (contributor) => contributor.contributions
        );

        const highestCommits = commitCounts.length
            ? Math.max(...commitCounts)
            : 0;

        const lowestCommits = commitCounts.length
            ? Math.min(...commitCounts)
            : 0;

        const averageCommits = contributorStatistics.length
            ? Number(
                (totalCommits / contributorStatistics.length).toFixed(2)
            )
            : 0;

        return res.status(200).json({
            success: true,
            repository: {
                id: repository.id,
                name: repository.fullName,
            },
            statistics: {
                totalContributors: contributorStatistics.length,
                totalCommits,
                averageCommitsPerContributor: averageCommits,
                highestCommits,
                lowestCommits,
            },
            contributors: contributorStatistics,
        });
    } catch (error) {
        console.error(
            "Fetching contribution statistics failed:",
            error.message
        );

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Repository contribution statistics not found on GitHub.",
            });
        }

        if (error.status === 403 || error.status === 401) {
            return res.status(502).json({
                success: false,
                message: "GitHub App is not authorized to access contribution statistics.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to fetch contribution statistics.",
        });
    }
};

export const fetchContributorLeaderboard = async (req, res) => {
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

        const contributors = [];
        let page = 1;

        while (true) {
            const { data } = await octokit.rest.repos.listContributors({
                owner,
                repo,
                per_page: 100,
                page,
                anon: true,
            });

            contributors.push(...data);

            if (data.length < 100) {
                break;
            }

            page++;
        }

        const totalContributions = contributors.reduce(
            (total, contributor) => total + (contributor.contributions || 0),
            0
        );

        const leaderboard = contributors
            .map((contributor) => ({
                githubUserId: contributor.id
                    ? String(contributor.id)
                    : null,
                username:
                    contributor.login || contributor.name || "Anonymous",
                avatarUrl: contributor.avatar_url || null,
                profileUrl: contributor.html_url || null,
                contributions: contributor.contributions || 0,
                percentage: totalContributions > 0
                    ? Number(
                        (
                            ((contributor.contributions || 0) /
                                totalContributions) *
                            100
                        ).toFixed(2)
                    )
                    : 0,
                type: contributor.type || "Anonymous",
            }))
            .sort((a, b) => b.contributions - a.contributions)
            .map((contributor, index) => ({
                rank: index + 1,
                ...contributor,
            }));

        return res.status(200).json({
            success: true,
            repository: {
                id: repository.id,
                name: repository.fullName,
            },
            totalContributors: leaderboard.length,
            totalContributions,
            leaderboard,
        });
    } catch (error) {
        console.error(
            "Fetching contributor leaderboard failed:",
            error.message
        );

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Repository contributors not found on GitHub.",
            });
        }

        if (error.status === 403 || error.status === 401) {
            return res.status(502).json({
                success: false,
                message: "GitHub App is not authorized to access contributors.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to fetch contributor leaderboard.",
        });
    }
};

export const fetchRepositoryActivityGraph = async (req, res) => {
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

        const response = await octokit.rest.repos.getCommitActivityStats({
            owner,
            repo,
        });

        // GitHub may still be calculating repository statistics.
        if (response.status === 202) {
            return res.status(202).json({
                success: false,
                processing: true,
                message: "GitHub is calculating activity statistics. Please try again shortly.",
            });
        }

        const weeklyActivity = (response.data || []).map((week) => ({
            weekStarting: new Date(week.week * 1000).toISOString(),
            totalCommits: week.total || 0,
            dailyCommits: week.days || [0, 0, 0, 0, 0, 0, 0],
        }));

        const totalCommits = weeklyActivity.reduce(
            (total, week) => total + week.totalCommits,
            0
        );

        const averageWeeklyCommits = weeklyActivity.length
            ? Number((totalCommits / weeklyActivity.length).toFixed(2))
            : 0;

        return res.status(200).json({
            success: true,
            repository: {
                id: repository.id,
                name: repository.fullName,
            },
            activity: {
                period: "Last 52 weeks",
                totalWeeks: weeklyActivity.length,
                totalCommits,
                averageWeeklyCommits,
                dailyLabels: [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                ],
                weeklyActivity,
            },
        });
    } catch (error) {
        console.error(
            "Fetching repository activity graph failed:",
            error.message
        );

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Repository activity statistics not found on GitHub.",
            });
        }

        if (error.status === 403 || error.status === 401) {
            return res.status(502).json({
                success: false,
                message: "GitHub App is not authorized to access repository activity.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to fetch repository activity statistics.",
        });
    }
};

export const compareContributors = async (req, res) => {
    try {
        const { repositoryId } = req.params;
        const { usernames } = req.query;

        if (
            typeof repositoryId !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repositoryId)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid repository ID is required.",
            });
        }

        if (typeof usernames !== "string") {
            return res.status(400).json({
                success: false,
                message: "Provide 2 to 4 GitHub usernames for comparison.",
            });
        }

        const selectedUsernames = usernames
            .split(",")
            .map((username) => username.trim());

        const normalizedUsernames = selectedUsernames.map(
            (username) => username.toLowerCase()
        );

        if (
            selectedUsernames.length < 2 ||
            selectedUsernames.length > 4 ||
            selectedUsernames.some(
                (username) => !/^[a-zA-Z0-9-]{1,39}$/.test(username)
            ) ||
            new Set(normalizedUsernames).size !== selectedUsernames.length
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide 2 to 4 unique, valid GitHub usernames.",
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

        const contributors = [];
        let page = 1;

        while (true) {
            const { data } = await octokit.rest.repos.listContributors({
                owner,
                repo,
                per_page: 100,
                page,
                anon: true,
            });

            contributors.push(...data);

            if (data.length < 100) {
                break;
            }

            page++;
        }

        const totalContributions = contributors.reduce(
            (total, contributor) =>
                total + (contributor.contributions || 0),
            0
        );

        const comparison = selectedUsernames.map((username) => {
            const contributor = contributors.find(
                (item) =>
                    item.login?.toLowerCase() === username.toLowerCase()
            );

            if (!contributor) {
                return null;
            }

            return {
                githubUserId: contributor.id
                    ? String(contributor.id)
                    : null,
                username: contributor.login,
                avatarUrl: contributor.avatar_url || null,
                profileUrl: contributor.html_url || null,
                contributions: contributor.contributions || 0,
                contributionPercentage: totalContributions > 0
                    ? Number(
                        (
                            ((contributor.contributions || 0) /
                                totalContributions) *
                            100
                        ).toFixed(2)
                    )
                    : 0,
                type: contributor.type || "Anonymous",
            };
        });

        const missingUsernames = selectedUsernames.filter(
            (_, index) => comparison[index] === null
        );

        if (missingUsernames.length > 0) {
            return res.status(404).json({
                success: false,
                message: "One or more selected users are not contributors to this repository.",
                missingUsernames,
            });
        }

        const rankedContributors = [...contributors].sort(
            (a, b) =>
                (b.contributions || 0) - (a.contributions || 0)
        );

        const rankedComparison = comparison.map((contributor) => {
            const rank = rankedContributors.findIndex(
                (item) =>
                    item.id &&
                    contributor.githubUserId === String(item.id)
            );

            return {
                ...contributor,
                rank: rank >= 0 ? rank + 1 : null,
            };
        });

        const contributionValues = rankedComparison.map(
            (contributor) => contributor.contributions
        );

        const highestContributions = Math.max(...contributionValues);
        const lowestContributions = Math.min(...contributionValues);

        return res.status(200).json({
            success: true,
            repository: {
                id: repository.id,
                name: repository.fullName,
            },
            comparison: {
                comparedCount: rankedComparison.length,
                totalRepositoryContributions: totalContributions,
                contributionDifference:
                    highestContributions - lowestContributions,
                highestContributor: rankedComparison.reduce(
                    (highest, current) =>
                        current.contributions > highest.contributions
                            ? current
                            : highest
                ),
                contributors: rankedComparison,
            },
        });
    } catch (error) {
        console.error(
            "Comparing repository contributors failed:",
            error.message
        );

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Repository contributors not found on GitHub.",
            });
        }

        if (error.status === 403 || error.status === 401) {
            return res.status(502).json({
                success: false,
                message: "GitHub App is not authorized to compare contributors.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to compare repository contributors.",
        });
    }
};

export const fetchContributionTimeline = async (req, res) => {
    try {
        const { repositoryId } = req.params;
        const page = Number(req.query.page ?? 1);
        const perPage = Number(req.query.perPage ?? 20);

        if (
            typeof repositoryId !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repositoryId)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid repository ID is required.",
            });
        }

        if (
            !Number.isInteger(page) ||
            page < 1 ||
            !Number.isInteger(perPage) ||
            perPage < 1 ||
            perPage > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Page must be positive and perPage must be between 1 and 100.",
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

        const { data } = await octokit.rest.repos.listCommits({
            owner,
            repo,
            per_page: perPage,
            page,
        });

        const timeline = data.map((item) => ({
            sha: item.sha,
            message: item.commit.message,
            commitUrl: item.html_url,
            author: {
                username: item.author?.login || null,
                name:
                    item.commit.author?.name ||
                    item.commit.committer?.name ||
                    "Unknown",
                avatarUrl: item.author?.avatar_url || null,
                profileUrl: item.author?.html_url || null,
            },
            date:
                item.commit.author?.date ||
                item.commit.committer?.date ||
                null,
        }));

        return res.status(200).json({
            success: true,
            repository: {
                id: repository.id,
                name: repository.fullName,
            },
            pagination: {
                currentPage: page,
                perPage,
                returnedCount: timeline.length,
                hasNextPage: timeline.length === perPage,
                nextPage:
                    timeline.length === perPage ? page + 1 : null,
            },
            totalCommitsOnPage: timeline.length,
            timeline,
        });
    } catch (error) {
        console.error(
            "Fetching contribution timeline failed:",
            error.message
        );

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Repository commits not found on GitHub.",
            });
        }

        if (error.status === 403 || error.status === 401) {
            return res.status(502).json({
                success: false,
                message: "GitHub App is not authorized to access repository commits.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to fetch contribution timeline.",
        });
    }
};
