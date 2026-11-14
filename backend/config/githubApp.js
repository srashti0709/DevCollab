
import "dotenv/config";

import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

const requiredVariables = [
  "GITHUB_APP_ID",
  "GITHUB_APP_PRIVATE_KEY_PATH",
  "GITHUB_APP_INSTALLATION_ID",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const appId = process.env.GITHUB_APP_ID.trim();
const installationId = process.env.GITHUB_APP_INSTALLATION_ID.trim();

if (!/^\d+$/.test(appId)) {
  throw new Error("GITHUB_APP_ID must be numeric.");
}

if (!/^\d+$/.test(installationId)) {
  throw new Error("GITHUB_APP_INSTALLATION_ID must be numeric.");
}

const backendRoot = fileURLToPath(new URL("../", import.meta.url));

const configuredKeyPath = process.env.GITHUB_APP_PRIVATE_KEY_PATH
  .trim()
  .replace(/^["']|["']$/g, "");

const privateKeyPath = isAbsolute(configuredKeyPath)
  ? configuredKeyPath
  : resolve(backendRoot, configuredKeyPath);

let privateKey;

try {
  privateKey = readFileSync(privateKeyPath, "utf8");
} catch {
  throw new Error(
    "GitHub App private key could not be read. Check GITHUB_APP_PRIVATE_KEY_PATH.",
  );
}

const appAuth = {
  appId: Number(appId),
  privateKey,
};

export const githubAppOctokit = new Octokit({
  authStrategy: createAppAuth,
  auth: appAuth,
});

// Create an authenticated Octokit client for a specific installation.
export const createGitHubInstallationOctokit = (installationId) => {
  const normalizedInstallationId = String(installationId).trim();

  if (!/^\d+$/.test(normalizedInstallationId)) {
    throw new Error("GitHub installation ID must be numeric.");
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      ...appAuth,
      installationId: Number(normalizedInstallationId),
    },
  });
};

// Existing configured installation client.
// Retained for backward compatibility with existing integration code.
export const githubInstallationOctokit =
  createGitHubInstallationOctokit(installationId);

export const getGitHubAppAuthentication = () =>
  githubAppOctokit.auth({ type: "app" });

export const getGitHubInstallationAuthentication = () =>
  githubInstallationOctokit.auth({ type: "installation" });
