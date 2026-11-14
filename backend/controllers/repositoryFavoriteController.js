
import prisma from "../config/prisma.js";

const isValidRepositoryId = (repositoryId) =>
    typeof repositoryId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        repositoryId
    );

// Add a repository to the authenticated user's favorites.
export const addRepositoryFavorite = async (req, res) => {
    try {
        const { repositoryId } = req.params;

        if (!isValidRepositoryId(repositoryId)) {
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
            select: {
                id: true,
            },
        });

        if (!repository) {
            return res.status(404).json({
                success: false,
                message: "Repository not found or you are not authorized to access it.",
            });
        }

        const favorite = await prisma.repositoryFavorite.upsert({
            where: {
                userId_repositoryId: {
                    userId: req.userId,
                    repositoryId,
                },
            },
            update: {},
            create: {
                userId: req.userId,
                repositoryId,
            },
            include: {
                repository: {
                    select: {
                        id: true,
                        name: true,
                        fullName: true,
                        description: true,
                        language: true,
                        stars: true,
                        forks: true,
                        visibility: true,
                        htmlUrl: true,
                    },
                },
            },
        });

        return res.status(200).json({
            success: true,
            message: "Repository added to favorites successfully.",
            favorite,
        });
    } catch (error) {
        console.error("Adding repository favorite failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to add repository to favorites.",
        });
    }
};

// Remove a repository from the authenticated user's favorites.
export const removeRepositoryFavorite = async (req, res) => {
    try {
        const { repositoryId } = req.params;

        if (!isValidRepositoryId(repositoryId)) {
            return res.status(400).json({
                success: false,
                message: "A valid repository ID is required.",
            });
        }

        const result = await prisma.repositoryFavorite.deleteMany({
            where: {
                userId: req.userId,
                repositoryId,
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
                message: "Favorite not found or you are not authorized to access it.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Repository removed from favorites successfully.",
        });
    } catch (error) {
        console.error("Removing repository favorite failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to remove repository from favorites.",
        });
    }
};

// List the authenticated user's accessible favorite repositories.
export const fetchRepositoryFavorites = async (req, res) => {
    try {
        const favorites = await prisma.repositoryFavorite.findMany({
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
                        githubRepoId: true,
                        name: true,
                        fullName: true,
                        description: true,
                        language: true,
                        stars: true,
                        forks: true,
                        visibility: true,
                        defaultBranch: true,
                        htmlUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const repositories = favorites.map((favorite) => ({
            ...favorite.repository,
            githubRepoId: favorite.repository.githubRepoId.toString(),
            favoritedAt: favorite.createdAt,
        }));

        return res.status(200).json({
            success: true,
            totalCount: repositories.length,
            repositories,
        });
    } catch (error) {
        console.error("Fetching repository favorites failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch repository favorites.",
        });
    }
};
