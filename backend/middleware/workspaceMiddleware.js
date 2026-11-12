
import prisma from "../config/prisma.js";

export const requireWorkspaceMember = async (req, res, next) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
            });
        }

        const workspaceId = req.params.workspaceId;

        if (!workspaceId) {
            return res.status(400).json({
                success: false,
                message: "Workspace ID is required.",
            });
        }

        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(workspaceId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid workspace ID.",
            });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: {
                id: true,
                createdBy: true,
            },
        });

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found.",
            });
        }

        // The workspace creator always has OWNER access.
        if (workspace.createdBy === req.userId) {
            req.workspaceMembership = {
                workspaceId,
                userId: req.userId,
                role: "OWNER",
            };

            return next();
        }

        // Check membership for other users.
        const membership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: req.userId,
                },
            },
            select: {
                id: true,
                role: true,
                workspaceId: true,
                userId: true,
            },
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this workspace.",
            });
        }

        req.workspaceMembership = {
            ...membership,
            role: workspace.createdBy === req.userId ? "OWNER" : "MEMBER",
        };

        next();
    } catch (error) {
        next(error);
    }
};

export const requireWorkspaceRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.workspaceMembership) {
            return res.status(500).json({
                success: false,
                message: "Workspace membership must be verified first.",
            });
        }

        if (!allowedRoles.includes(req.workspaceMembership.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this workspace action.",
            });
        }

        next();
    };
};
