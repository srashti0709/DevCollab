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
});