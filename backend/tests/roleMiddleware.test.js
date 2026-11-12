
import { describe, it, expect, vi, beforeEach } from "vitest";

const { findUser } = vi.hoisted(() => ({
  findUser: vi.fn(),
}));

vi.mock("../config/prisma.js", () => ({
  default: {
    user: {
      findUnique: findUser,
    },
  },
}));

import requirePlatformRole from "../middleware/roleMiddleware.js";

const createResponse = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
};

describe("Platform Role Authorization Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject unauthenticated users", async () => {
    const req = {};
    const res = createResponse();
    const next = vi.fn();

    await requirePlatformRole("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(findUser).not.toHaveBeenCalled();
  });

  it("should reject users who do not exist", async () => {
    const req = { userId: "user-123" };
    const res = createResponse();
    const next = vi.fn();

    findUser.mockResolvedValue(null);

    await requirePlatformRole("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow users with the required platform role", async () => {
    const req = { userId: "user-123" };
    const res = createResponse();
    const next = vi.fn();

    findUser.mockResolvedValue({
      platformRole: "ADMIN",
    });

    await requirePlatformRole("ADMIN")(req, res, next);

    expect(req.user.platformRole).toBe("ADMIN");
    expect(next).toHaveBeenCalledOnce();
  });

  it("should reject regular users from ADMIN-only operations", async () => {
    const req = { userId: "user-456" };
    const res = createResponse();
    const next = vi.fn();

    findUser.mockResolvedValue({
      platformRole: "USER",
    });

    await requirePlatformRole("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow any of the specified platform roles", async () => {
    const req = { userId: "user-789" };
    const res = createResponse();
    const next = vi.fn();

    findUser.mockResolvedValue({
      platformRole: "USER",
    });

    await requirePlatformRole("ADMIN", "USER")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("should pass database errors to the error handler", async () => {
    const req = { userId: "user-123" };
    const res = createResponse();
    const next = vi.fn();
    const error = new Error("Database connection failed");

    findUser.mockRejectedValue(error);

    await requirePlatformRole("ADMIN")(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
