
import prisma from "../config/prisma.js";
import { createGitHubInstallationOctokit } from "../config/githubApp.js";
import { ensurePersonalWorkspace } from "../utils/personalWorkspace.js";

export const getPersonalWorkspace = async (req, res) => {
    try {
        const workspace = await ensurePersonalWorkspace(req.userId);

        return res.status(200).json({
            success: true,
            workspace: {
                id: workspace.id,
                name: workspace.name,
                slug: workspace.slug,
                type: workspace.type,
            },
        });
    } catch (error) {
        console.error("Fetching personal workspace failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve your personal workspace.",
        });
    }
};

export const fetchAvailableRepositories = async (req, res) => {
    try {
        const connections = await prisma.gitHubInstallationConnection.findMany({
            where: {
                userId: req.userId,
            },
            include: {
                installation: true,
            },
        });

        if (connections.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No GitHub App installation is connected to your account.",
            });
        }

        const repositoriesMap = new Map();

        for (const connection of connections) {
            const installation = connection.installation;

            const octokit = createGitHubInstallationOctokit(
                installation.githubInstallationId.toString()
            );

            let page = 1;

            while (true) {
                const { data } = await octokit.request(
                    "GET /installation/repositories",
                    {
                        per_page: 100,
                        page,
                    }
                );

                for (const repository of data.repositories) {
                    repositoriesMap.set(String(repository.id), {
                        githubRepoId: String(repository.id),
                        name: repository.name,
                        fullName: repository.full_name,
                        description: repository.description,
                        language: repository.language,
                        stars: repository.stargazers_count,
                        forks: repository.forks_count,
                        visibility: repository.visibility,
                        defaultBranch: repository.default_branch,
                        htmlUrl: repository.html_url,
                        isPrivate: repository.private,
                        ownerLogin: repository.owner.login,
                        installationId: installation.id,
                        installationAccount: installation.accountLogin,
                    });
                }

                if (data.repositories.length < 100) {
                    break;
                }

                page++;
            }
        }

        const repositories = Array.from(repositoriesMap.values());

        return res.status(200).json({
            success: true,
            totalCount: repositories.length,
            repositories,
        });
    } catch (error) {
        console.error("Fetching GitHub repositories failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch GitHub repositories.",
        });
    }
};

export const connectRepository = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { githubRepoId, installationId } = req.body;

        if (
            typeof workspaceId !== "string" ||
            typeof githubRepoId !== "string" ||
            !/^\d+$/.test(githubRepoId) ||
            typeof installationId !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid workspace, repository, and installation IDs are required.",
            });
        }

        // Verify that the authenticated user belongs to this workspace.
        const membership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: req.userId,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to connect repositories to this workspace.",
            });
        }

        // Verify that this installation is connected to the authenticated user.
        const installationConnection =
            await prisma.gitHubInstallationConnection.findFirst({
                where: {
                    userId: req.userId,
                    installationId,
                },
                include: {
                    installation: true,
                },
            });

        if (!installationConnection) {
            return res.status(403).json({
                success: false,
                message: "This GitHub App installation is not connected to your account.",
            });
        }

        const installation = installationConnection.installation;

        const octokit = createGitHubInstallationOctokit(
            installation.githubInstallationId.toString()
        );

        // Verify that GitHub actually exposes this repository to the installation.
        let githubRepository = null;
        let page = 1;

        while (true) {
            const { data } = await octokit.request(
                "GET /installation/repositories",
                {
                    per_page: 100,
                    page,
                }
            );

            githubRepository = data.repositories.find(
                (repository) => String(repository.id) === githubRepoId
            );

            if (githubRepository || data.repositories.length < 100) {
                break;
            }

            page++;
        }

        if (!githubRepository) {
            return res.status(404).json({
                success: false,
                message: "Repository is not available through this GitHub App installation.",
            });
        }

        const visibility = String(
            githubRepository.visibility || (
                githubRepository.private ? "private" : "public"
            )
        ).toUpperCase();

        if (!["PUBLIC", "PRIVATE", "INTERNAL"].includes(visibility)) {
            throw new Error("GitHub returned an unsupported repository visibility.");
        }

        // Save the repository and its workspace connection atomically.
        const result = await prisma.$transaction(async (transaction) => {
            const repository = await transaction.repository.upsert({
                where: {
                    githubRepoId: BigInt(githubRepository.id),
                },
                update: {
                    name: githubRepository.name,
                    fullName: githubRepository.full_name,
                    description: githubRepository.description,
                    language: githubRepository.language,
                    stars: githubRepository.stargazers_count,
                    forks: githubRepository.forks_count,
                    visibility,
                    defaultBranch: githubRepository.default_branch,
                    htmlUrl: githubRepository.html_url,
                    installationId: installation.id,
                },
                create: {
                    githubRepoId: BigInt(githubRepository.id),
                    name: githubRepository.name,
                    fullName: githubRepository.full_name,
                    description: githubRepository.description,
                    language: githubRepository.language,
                    stars: githubRepository.stargazers_count,
                    forks: githubRepository.forks_count,
                    visibility,
                    defaultBranch: githubRepository.default_branch,
                    htmlUrl: githubRepository.html_url,
                    installationId: installation.id,
                },
            });

            const workspaceRepository =
                await transaction.workspaceRepository.upsert({
                    where: {
                        workspaceId_repositoryId: {
                            workspaceId,
                            repositoryId: repository.id,
                        },
                    },
                    update: {},
                    create: {
                        workspaceId,
                        repositoryId: repository.id,
                        connectedBy: req.userId,
                    },
                    include: {
                        repository: true,
                    },
                });

            return workspaceRepository;
        });

        const repositoryResponse = {
            ...result.repository,
            githubRepoId: result.repository.githubRepoId.toString(),
        };

        return res.status(200).json({
            success: true,
            message: "Repository connected to workspace successfully.",
            repository: repositoryResponse,
            connectedAt: result.connectedAt,
        });
    } catch (error) {
        console.error("Connecting GitHub repository failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to connect repository to workspace.",
        });
    }
};

export const fetchConnectedRepositories = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        if (!workspaceId) {
            return res.status(400).json({
                success: false,
                message: "Workspace ID is required.",
            });
        }

        // Verify that the authenticated user belongs to this workspace.
        const membership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: req.userId,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this workspace's repositories.",
            });
        }

        const connections = await prisma.workspaceRepository.findMany({
            where: {
                workspaceId,
            },
            include: {
                repository: true,
                connector: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                connectedAt: "desc",
            },
        });

        const repositories = connections.map((connection) => ({
            ...connection.repository,
            githubRepoId: connection.repository.githubRepoId.toString(),
            connectedAt: connection.connectedAt,
            connectedBy: connection.connector,
        }));

        return res.status(200).json({
            success: true,
            workspaceId,
            totalCount: repositories.length,
            repositories,
        });
    } catch (error) {
        console.error("Fetching connected repositories failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch connected repositories.",
        });
    }
};

