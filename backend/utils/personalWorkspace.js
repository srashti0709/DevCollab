
import prisma from "../config/prisma.js";

export const ensurePersonalWorkspace = async (userId) => {
    if (typeof userId !== "string" || !userId.trim()) {
        throw new Error("A valid user ID is required.");
    }

    const existingWorkspace = await prisma.workspace.findFirst({
        where: {
            createdBy: userId,
            type: "PERSONAL",
        },
        include: {
            members: true,
        },
    });

    if (existingWorkspace) {
        return existingWorkspace;
    }

    const slug = `personal-${userId}`;

    try {
        return await prisma.workspace.create({
            data: {
                name: "Personal Workspace",
                slug,
                type: "PERSONAL",
                createdBy: userId,
                members: {
                    create: {
                        userId,
                        role: "OWNER",
                    },
                },
            },
            include: {
                members: true,
            },
        });
    } catch (error) {
        // Another request may have created the workspace simultaneously.
        if (error.code === "P2002") {
            const workspace = await prisma.workspace.findFirst({
                where: {
                    createdBy: userId,
                    type: "PERSONAL",
                },
                include: {
                    members: true,
                },
            });

            if (workspace) {
                return workspace;
            }
        }

        throw error;
    }
};
