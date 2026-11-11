# DevCollab — Workflow Diagrams

These diagrams describe the primary user journeys and system workflows.

## 1. GitHub Authentication Workflow

```mermaid
flowchart TD
    A[Open DevCollab] --> B[Select Login with GitHub]
    B --> C[Redirect to GitHub OAuth]
    C --> D[User Authorizes Access]
    D --> E[Validate OAuth Response]
    E --> F{Existing Account?}
    F -->|Yes| G[Retrieve User Account]
    F -->|No| H[Create New Account]
    G --> I[Create Redis Session]
    H --> I
    I --> J[Set Secure HTTP-only Cookie]
    J --> K[Open Personal Workspace]
```

## 2. Personal Workspace Workflow

```mermaid
flowchart TD
    A[Login] --> B[Open Personal Workspace]
    B --> C[Connect GitHub App]
    C --> D[Select Repositories]
    D --> E[Import Repositories]
    E --> F[Synchronize Repository Data]
    F --> G[Repository Dashboard]
    G --> H[Issues and Pull Requests]
    G --> I[Personal Analytics]
    G --> J[Notifications]
```

## 3. Team Workspace Workflow

```mermaid
flowchart TD
    A[Open DevCollab] --> B[Create Team Workspace]
    B --> C[Enter Team Details]
    C --> D[Invite Team Members]
    D --> E[Members Accept Invitations]
    E --> F[Connect GitHub Repositories]
    F --> G[Import Authorized Repositories]
    G --> H[Shared Team Workspace]
    H --> I[Collaboration]
    H --> J[Team Analytics]
    H --> K[Team Settings]
```

## 4. Repository Synchronization Workflow

```mermaid
flowchart TD
    A[GitHub Event] --> B[GitHub Webhook]
    B --> C[Verify Webhook Signature]
    C --> D{Valid Event?}
    D -->|No| E[Reject Event]
    D -->|Yes| F[Process Event Safely]
    F --> G[Queue Background Job]
    G --> H[Worker Processes Job]
    H --> I[Update PostgreSQL]
    I --> J[Record Sync Status]
    J --> K[Updated DevCollab Interface]

    L[Scheduled Reconciliation] --> G
    M[Manual Sync] --> G
```

## 5. Issue Management Workflow

```mermaid
flowchart TD
    A[Open Issue Explorer] --> B[Select Repository]
    B --> C[View Issues]
    C --> D{Choose Action}
    D -->|Create| E[Create Issue]
    D -->|Manage| F[Update Issue]
    D -->|Collaborate| G[Comments and Private Notes]
    E --> H[GitHub Synchronization]
    F --> H
    G --> I[Save DevCollab Private Data]
    H --> J[Updated Issue View]
    I --> J
```

## 6. Pull Request Workflow

```mermaid
flowchart TD
    A[Open Pull Request Management] --> B[Select Repository]
    B --> C[View Pull Requests]
    C --> D[Open Pull Request]
    D --> E[Inspect Code Changes]
    E --> F[Review and Discuss]
    F --> G[Run CI/CD Checks]
    G --> H{Checks and Reviews Satisfactory?}
    H -->|No| I[Request Changes]
    I --> D
    H -->|Yes| J[Authorized Human Approves]
    J --> K[Authorized GitHub Merge]
    K --> L[Synchronize Updated PR Status]
```

## 7. Analytics Workflow

```mermaid
flowchart TD
    A[Open Analytics] --> B[Select Analytics Scope]
    B --> C[Personal / Team / Repository]
    C --> D[Retrieve Available GitHub Data]
    D --> E[Validate Data Quality]
    E --> F[Process Metrics]
    F --> G[Generate Analytics]
    G --> H[Display Dashboard]
    H --> I[Apply Filters]
    H --> J[Generate Reports]
    H --> K[Explore Metric Definitions]
```

## 8. Notification Workflow

```mermaid
flowchart TD
    A[GitHub or DevCollab Event] --> B[Process Event]
    B --> C[Identify Eligible Recipients]
    C --> D[Check Notification Preferences]
    D --> E[Generate Notification]
    E --> F[In-App Notification]
    E --> G[Configured Email Notification]
    F --> H[User Opens Notification]
    G --> H
    H --> I[Navigate to Relevant Resource]
```

## 9. Account Deletion Workflow

```mermaid
flowchart TD
    A[Open Account Settings] --> B[Select Permanent Deletion]
    B --> C[Re-authenticate User]
    C --> D[Review Data Retention Options]
    D --> E[Confirm Deletion Request]
    E --> F[Start 30-Day Grace Period]
    F --> G{Cancellation Requested?}
    G -->|Yes| H[Cancel Deletion]
    G -->|No| I[Proceed with Permanent Deletion]
    I --> J[Delete Eligible Account Data]
```

## 10. Overall System Architecture

```mermaid
flowchart TD
    U[Users] --> FE[React Frontend]
    FE --> API[Express Backend API]

    API --> AUTH[Authentication and Authorization]
    API --> DB[(PostgreSQL)]
    API --> REDIS[(Redis)]
    API --> GH[GitHub APIs via Octokit]

    API --> QUEUE[BullMQ]
    QUEUE --> WORKER[Background Workers]
    WORKER --> DB
    WORKER --> GH

    GH --> WEBHOOK[GitHub Webhooks]
    WEBHOOK --> API

    API --> MON[Monitoring and Logging]
```

## Diagram Notes

- GitHub remains authoritative for GitHub-native resources and permissions.
- Redis manages server-side sessions and caching.
- PostgreSQL stores application data.
- BullMQ handles asynchronous background processing.
- GitHub Webhooks trigger event-driven synchronization.
- Private notes remain exclusive to DevCollab.
- AI suggestions require human review before consequential actions.
- All operations must respect the user's actual authorization.