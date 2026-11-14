
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("Backend API", () => {
  it("should return a successful response from the home route", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "DevCollab backend is running!",
    });
  });

  it("should reject unauthenticated requests to the repository issues endpoint", async () => {
    const response = await request(app).get(
      "/api/github/repositories/123e4567-e89b-12d3-a456-426614174000/issues"
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
