-- CreateTable
CREATE TABLE "GitHubInstallationConnection" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "installationId" UUID NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GitHubInstallationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GitHubInstallationConnection_installationId_idx" ON "GitHubInstallationConnection"("installationId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubInstallationConnection_userId_installationId_key" ON "GitHubInstallationConnection"("userId", "installationId");

-- AddForeignKey
ALTER TABLE "GitHubInstallationConnection" ADD CONSTRAINT "GitHubInstallationConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubInstallationConnection" ADD CONSTRAINT "GitHubInstallationConnection_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "GitHubAppInstallation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
