
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import App from "./App";

afterEach(() => {
  vi.unstubAllGlobals();
});

const renderApp = async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        message: "Authentication required.",
      }),
    })
  );

  await act(async () => {
    render(<App />);
  });
};

describe("App component", () => {
  it("renders the DevCollab login page", async () => {
    await renderApp();

    expect(
      screen.getByRole("heading", { name: /welcome to devcollab/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /continue with github/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /terms of service/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /privacy policy/i })
    ).toBeInTheDocument();
  });

  it("redirects to GitHub OAuth when the login button is clicked", async () => {
    const user = userEvent.setup();

    const originalLocation = window.location;

    delete window.location;

    window.location = {
      ...originalLocation,
      href: "",
    };

    try {
      await renderApp();

      await user.click(
        screen.getByRole("button", { name: /continue with github/i })
      );

      expect(window.location.href).toBe("/api/auth/github");
    } finally {
      window.location = originalLocation;
    }
  });
});
