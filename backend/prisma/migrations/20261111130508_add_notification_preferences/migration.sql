-- CreateTable
CREATE TABLE "NotificationPreference" (
    "userId" UUID NOT NULL,
    "pullRequestUpdates" BOOLEAN NOT NULL DEFAULT true,
    "issueUpdates" BOOLEAN NOT NULL DEFAULT true,
    "repositoryActivity" BOOLEAN NOT NULL DEFAULT true,
    "workspaceInvitations" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
