
import { describe, it, expect, vi, beforeEach } from "vitest";

const { findWorkspace, findMembership } = vi.hoisted(() => ({
    findWorkspace: vi.fn(),
    findMembership: vi.fn(),
}));

vi.mock("../config/prisma.js", () => ({
    default: {
        workspace: {
            findUnique: findWorkspace,
        },
        workspaceMember: {
            findUnique: findMembership,
        },
    },
}));

import {
    requireWorkspaceMember,
    requireWorkspaceRole,
} from "../middleware/workspaceMiddleware.js";

const createResponse = () => {
    const res = {
        status: vi.fn(),
        json: vi.fn(),
    };

    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);

    return res;
};

describe("Workspace Authorization Middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should reject unauthenticated users", async () => {
        const req = {
            params: {
                workspaceId: "11111111-1111-4111-8111-111111111111",
            },
        };
        const res = createResponse();
        const next = vi.fn();

        await requireWorkspaceMember(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
    it("should reject requests with a missing workspace ID", async () => {
        const req = {
            userId: "user-123",
            params: {},
        };
        const res = createResponse();
        const next = vi.fn();

        await requireWorkspaceMember(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Workspace ID is required.",
        });
        expect(next).not.toHaveBeenCalled();
        expect(findWorkspace).not.toHaveBeenCalled();
    });

    it("should allow the workspace creator as OWNER", async () => {
        const req = {
            userId: "user-123",
            params: {
                workspaceId: "11111111-1111-4111-8111-111111111111",
            },
        };
        const res = createResponse();
        const next = vi.fn();

        findWorkspace.mockResolvedValue({
            id: "11111111-1111-4111-8111-111111111111",
            createdBy: "user-123",
        });

        await requireWorkspaceMember(req, res, next);

        expect(req.workspaceMembership.role).toBe("OWNER");
        expect(next).toHaveBeenCalledOnce();
        expect(findMembership).not.toHaveBeenCalled();
    });

    it("should allow an existing workspace member", async () => {
        const req = {
            userId: "user-456",
            params: {
                workspaceId: "11111111-1111-4111-8111-111111111111",
            },
        };
        const res = createResponse();
        const next = vi.fn();

        findWorkspace.mockResolvedValue({
            id: "11111111-1111-4111-8111-111111111111",
            createdBy: "user-123",
        });

        findMembership.mockResolvedValue({
            id: "membership-123",
            workspaceId: "11111111-1111-4111-8111-111111111111",
            userId: "user-456",
            role: "MEMBER",
        });

        await requireWorkspaceMember(req, res, next);

        expect(req.workspaceMembership.role).toBe("MEMBER");
        expect(next).toHaveBeenCalledOnce();
    });
    it("should treat a non-creator with an OWNER membership record as MEMBER", async () => {
        const req = {
            userId: "user-456",
            params: {
                workspaceId: "11111111-1111-4111-8111-111111111111",
            },
        };
        const res = createResponse();
        const next = vi.fn();

        findWorkspace.mockResolvedValue({
            id: "11111111-1111-4111-8111-111111111111",
            createdBy: "user-123",
        });

        findMembership.mockResolvedValue({
            id: "membership-123",
            workspaceId: "11111111-1111-4111-8111-111111111111",
            userId: "user-456",
            role: "OWNER",
        });

        await requireWorkspaceMember(req, res, next);

        expect(req.workspaceMembership.role).toBe("MEMBER");
        expect(next).toHaveBeenCalledOnce();

        const roleResponse = createResponse();
        const roleNext = vi.fn();

        requireWorkspaceRole("OWNER")(req, roleResponse, roleNext);

        expect(roleResponse.status).toHaveBeenCalledWith(403);
        expect(roleNext).not.toHaveBeenCalled();
    });

    it("should reject users who are not workspace members", async () => {
        const req = {
            userId: "user-789",
            params: {
                workspaceId: "11111111-1111-4111-8111-111111111111",
            },
        };
        const res = createResponse();
        const next = vi.fn();

        findWorkspace.mockResolvedValue({
            id: "11111111-1111-4111-8111-111111111111",
            createdBy: "user-123",
        });

        findMembership.mockResolvedValue(null);

        await requireWorkspaceMember(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it("should reject an invalid workspace UUID", async () => {
        const req = {
            userId: "user-123",
            params: {
                workspaceId: "invalid-id",
            },
        };
        const res = createResponse();
        const next = vi.fn();

        await requireWorkspaceMember(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Invalid workspace ID.",
        });
        expect(next).not.toHaveBeenCalled();
        expect(findWorkspace).not.toHaveBeenCalled();
    });

    it("should return 404 when the workspace does not exist", async () => {
        const req = {
            userId: "user-123",
            params: {
                workspaceId: "11111111-1111-4111-8111-111111111111",
            },
        };
        const res = createResponse();
        const next = vi.fn();

        findWorkspace.mockResolvedValue(null);

        await requireWorkspaceMember(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(next).not.toHaveBeenCalled();
    });
    it("should forward database errors to Express error handling", async () => {
        const req = {
            userId: "user-123",
            params: {
                workspaceId: "11111111-1111-4111-8111-111111111111",
            },
        };
        const res = createResponse();
        const next = vi.fn();

        const databaseError = new Error("Database connection failed");

        findWorkspace.mockRejectedValue(databaseError);

        await requireWorkspaceMember(req, res, next);

        expect(next).toHaveBeenCalledWith(databaseError);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject members from OWNER-only operations", () => {
        const req = {
            workspaceMembership: {
                role: "MEMBER",
            },
        };
        const res = createResponse();
        const next = vi.fn();

        requireWorkspaceRole("OWNER")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it("should allow owners to perform OWNER-only operations", () => {
        const req = {
            workspaceMembership: {
                role: "OWNER",
            },
        };
        const res = createResponse();
        const next = vi.fn();

        requireWorkspaceRole("OWNER")(req, res, next);

        expect(next).toHaveBeenCalledOnce();
    });
});
