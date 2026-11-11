# DevCollab — Entity Relationship Diagram (ER Diagram)

## 1. Introduction

This document represents the database entities of DevCollab and the relationships between them.

The ER Diagram is based on the database planning document and represents how records will be connected in PostgreSQL.

## 2. ER Diagram

```mermaid
erDiagram
    USERS ||--o{ GITHUB_ACCOUNTS : links
    USERS ||--o{ WORKSPACES : creates
    USERS ||--o{ WORKSPACE_MEMBERS : joins
    WORKSPACES ||--o{ WORKSPACE_MEMBERS : contains

    USERS ||--o{ WORKSPACE_INVITATIONS : sends
    WORKSPACES ||--o{ WORKSPACE_INVITATIONS : receives

    GITHUB_APP_INSTALLATIONS ||--o{ REPOSITORIES : provides_access
    WORKSPACES ||--o{ WORKSPACE_REPOSITORIES : connects
    REPOSITORIES ||--o{ WORKSPACE_REPOSITORIES : belongs_to

    REPOSITORIES ||--o{ ISSUES : contains
    REPOSITORIES ||--o{ PULL_REQUESTS : contains

    REPOSITORIES ||--o{ CONTRIBUTION_EVENTS : records
    CONTRIBUTORS ||--o{ CONTRIBUTION_EVENTS : generates
    ISSUES o|--o{ CONTRIBUTION_EVENTS : relates_to
    PULL_REQUESTS o|--o{ CONTRIBUTION_EVENTS : relates_to

    USERS ||--o{ NOTIFICATIONS : receives
    WORKSPACES o|--o{ NOTIFICATIONS : relates_to

    REPOSITORIES ||--o{ SYNC_RUNS : tracks

    GITHUB_APP_INSTALLATIONS o|--o{ WEBHOOK_DELIVERIES : receives

    USERS {
        uuid id PK
        string name
        string email
        string avatar_url
        string platform_role
        datetime created_at
        datetime updated_at
    }

    GITHUB_ACCOUNTS {
        uuid id PK
        uuid user_id FK
        bigint github_user_id
        string github_username
        string access_token_encrypted
        datetime token_expires_at
        datetime created_at
        datetime updated_at
    }

    WORKSPACES {
        uuid id PK
        string name
        string slug
        string type
        uuid created_by FK
        datetime created_at
        datetime updated_at
    }

    WORKSPACE_MEMBERS {
        uuid id PK
        uuid workspace_id FK
        uuid user_id FK
        string role
        datetime joined_at
    }

    WORKSPACE_INVITATIONS {
        uuid id PK
        uuid workspace_id FK
        string invited_email
        uuid invited_by FK
        string role
        string status
        datetime expires_at
        datetime created_at
    }

    GITHUB_APP_INSTALLATIONS {
        uuid id PK
        bigint github_installation_id
        string account_login
        string account_type
        datetime created_at
        datetime updated_at
    }

    REPOSITORIES {
        uuid id PK
        bigint github_repo_id
        string name
        string full_name
        string description
        string visibility
        string default_branch
        string html_url
        uuid installation_id FK
        datetime last_synced_at
        datetime created_at
        datetime updated_at
    }

    WORKSPACE_REPOSITORIES {
        uuid id PK
        uuid workspace_id FK
        uuid repository_id FK
        uuid connected_by FK
        datetime connected_at
    }

    ISSUES {
        uuid id PK
        bigint github_issue_id
        uuid repository_id FK
        int issue_number
        string title
        string state
        string author_login
        string assignee_login
        datetime created_at
        datetime updated_at
        datetime closed_at
    }

    PULL_REQUESTS {
        uuid id PK
        bigint github_pr_id
        uuid repository_id FK
        int pr_number
        string title
        string state
        string author_login
        string base_branch
        string head_branch
        datetime created_at
        datetime updated_at
        datetime merged_at
    }

    CONTRIBUTORS {
        uuid id PK
        bigint github_user_id
        string github_username
        string avatar_url
        datetime created_at
        datetime updated_at
    }

    CONTRIBUTION_EVENTS {
        uuid id PK
        uuid repository_id FK
        uuid contributor_id FK
        string event_type
        string github_event_id
        uuid issue_id FK
        uuid pull_request_id FK
        datetime occurred_at
        datetime created_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        uuid workspace_id FK
        string type
        string title
        string message
        boolean is_read
        datetime created_at
    }

    SYNC_RUNS {
        uuid id PK
        uuid repository_id FK
        string status
        string sync_type
        datetime started_at
        datetime completed_at
        string error_message
        datetime created_at
    }

    WEBHOOK_DELIVERIES {
        uuid id PK
        string github_delivery_id
        uuid installation_id FK
        string event_type
        string status
        datetime received_at
        datetime processed_at
    }
```

## 3. Relationship Summary

| Relationship | Type |
|---|---|
| User → GitHub Accounts | One-to-Many |
| User → Workspaces | One-to-Many |
| User → Workspace Members | One-to-Many |
| Workspace → Workspace Members | One-to-Many |
| Workspace → Workspace Invitations | One-to-Many |
| User → Workspace Invitations | One-to-Many |
| GitHub App Installation → Repositories | One-to-Many |
| Workspace → Workspace Repositories | One-to-Many |
| Repository → Workspace Repositories | One-to-Many |
| Repository → Issues | One-to-Many |
| Repository → Pull Requests | One-to-Many |
| Repository → Contribution Events | One-to-Many |
| Contributor → Contribution Events | One-to-Many |
| Issue → Contribution Events | One-to-Many |
| Pull Request → Contribution Events | One-to-Many |
| User → Notifications | One-to-Many |
| Workspace → Notifications | One-to-Many (optional workspace) |
| Repository → Sync Runs | One-to-Many |
| GitHub App Installation → Webhook Deliveries | One-to-Many (optional installation) |

## 4. Important Notes

1. `PK` means Primary Key: a field that uniquely identifies a record.
2. `FK` means Foreign Key: a field that references another entity.
3. Workspace Members connects users and workspaces.
4. Workspace Repositories connects workspaces and repositories.
5. A contributor can exist without having a DevCollab account.
6. Issue and Pull Request references in Contribution Events are optional.
7. A workspace can receive notifications, but some notifications may be personal and have no workspace.
8. GitHub remains the source of truth for GitHub-native information.

## 5. Conclusion

This ER Diagram provides a visual representation of DevCollab's planned database structure.

It will serve as the reference for creating the detailed Prisma database schema in the next step.