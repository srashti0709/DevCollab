# DevCollab — Database Planning

## 1. Introduction

DevCollab will use **PostgreSQL** as its primary database and **Prisma ORM** for database access.

The database will store application users, workspaces, repository connections, GitHub activity snapshots, analytics-related data, and notifications.

GitHub will remain the source of truth for GitHub-native information and permissions.

## 2. Main Database Entities

An entity represents something important in the application that needs to be stored.

The following entities are planned for DevCollab.

| No. | Entity | Purpose |
|---|---|---|
| 1 | Users | Stores DevCollab user accounts and profiles |
| 2 | GitHub Accounts | Stores linked GitHub account information |
| 3 | Workspaces | Stores personal and team workspaces |
| 4 | Workspace Members | Connects users with workspaces and their roles |
| 5 | Workspace Invitations | Stores pending workspace invitations |
| 6 | GitHub App Installations | Stores GitHub App installation information |
| 7 | Repositories | Stores connected repository metadata |
| 8 | Workspace Repositories | Connects repositories with workspaces |
| 9 | Issues | Stores selected GitHub issue information |
| 10 | Pull Requests | Stores selected GitHub pull request information |
| 11 | Contributors | Stores GitHub contributor identities |
| 12 | Contribution Events | Stores observable contribution activity |
| 13 | Notifications | Stores DevCollab notifications |
| 14 | Sync Runs | Tracks repository synchronization operations |
| 15 | Webhook Deliveries | Tracks received GitHub webhook deliveries |

## 3. Entity Attributes

Attributes are the individual fields or columns belonging to an entity.

### 3.1 Users

Stores information about registered DevCollab users.

| Attribute | Description |
|---|---|
| id | Unique user identifier (Primary Key) |
| name | User's display name |
| email | User's email address |
| avatar_url | User profile image |
| platform_role | Platform-level role, such as user or administrator |
| created_at | Account creation date |
| updated_at | Last profile update |

### 3.2 GitHub Accounts

Stores GitHub account information linked to a DevCollab user.

| Attribute | Description |
|---|---|
| id | Unique account identifier (Primary Key) |
| user_id | Linked DevCollab user (Foreign Key) |
| github_user_id | Unique GitHub user ID |
| github_username | GitHub username |
| access_token_encrypted | Encrypted OAuth token, if required |
| token_expires_at | Token expiration time, if applicable |
| created_at | Account linking date |
| updated_at | Last update |

### 3.3 Workspaces

Stores personal and team workspaces.

| Attribute | Description |
|---|---|
| id | Unique workspace identifier (Primary Key) |
| name | Workspace name |
| slug | Unique workspace URL identifier |
| type | Personal or team |
| created_by | User who created the workspace (Foreign Key) |
| created_at | Workspace creation date |
| updated_at | Last update |

### 3.4 Workspace Members

Connects users with workspaces.

| Attribute | Description |
|---|---|
| id | Unique membership identifier (Primary Key) |
| workspace_id | Associated workspace (Foreign Key) |
| user_id | Associated user (Foreign Key) |
| role | Workspace-level role, such as owner or member |
| joined_at | Membership creation date |

### 3.5 Workspace Invitations

Stores invitations sent to users to join team workspaces.

| Attribute | Description |
|---|---|
| id | Unique invitation identifier (Primary Key) |
| workspace_id | Target workspace (Foreign Key) |
| invited_email | Email address of invited person |
| invited_by | User who sent the invitation (Foreign Key) |
| role | Role offered to the invited user |
| status | Pending, accepted, expired, or revoked |
| expires_at | Invitation expiration date |
| created_at | Invitation creation date |

### 3.6 GitHub App Installations

Stores information about GitHub App installations authorized for DevCollab.

| Attribute | Description |
|---|---|
| id | Unique installation record identifier (Primary Key) |
| github_installation_id | GitHub installation ID |
| account_login | GitHub account or organization login |
| account_type | GitHub account type |
| created_at | Installation record creation date |
| updated_at | Last synchronization or update |

### 3.7 Repositories

Stores selected metadata about connected GitHub repositories.

| Attribute | Description |
|---|---|
| id | Unique repository identifier (Primary Key) |
| github_repo_id | Unique GitHub repository ID |
| name | Repository name |
| full_name | Repository owner and repository name |
| description | Repository description |
| visibility | Public or private |
| default_branch | Default repository branch |
| html_url | GitHub repository URL |
| installation_id | Associated GitHub App installation (Foreign Key) |
| last_synced_at | Last successful synchronization |
| created_at | Record creation date |
| updated_at | Last update |

### 3.8 Workspace Repositories

Connects repositories with workspaces.

| Attribute | Description |
|---|---|
| id | Unique connection identifier (Primary Key) |
| workspace_id | Associated workspace (Foreign Key) |
| repository_id | Associated repository (Foreign Key) |
| connected_by | User who connected the repository (Foreign Key) |
| connected_at | Connection date |

### 3.9 Issues

Stores selected GitHub issue information.

| Attribute | Description |
|---|---|
| id | Unique issue identifier (Primary Key) |
| github_issue_id | GitHub issue ID |
| repository_id | Associated repository (Foreign Key) |
| issue_number | Issue number within the repository |
| title | Issue title |
| state | Open or closed |
| author_login | GitHub username of issue author |
| assignee_login | GitHub username of assignee, if available |
| created_at | Issue creation date |
| updated_at | Last update |
| closed_at | Issue closure date, if available |

### 3.10 Pull Requests

Stores selected GitHub pull request information.

| Attribute | Description |
|---|---|
| id | Unique pull request identifier (Primary Key) |
| github_pr_id | GitHub pull request ID |
| repository_id | Associated repository (Foreign Key) |
| pr_number | Pull request number within the repository |
| title | Pull request title |
| state | Open, closed, or merged |
| author_login | GitHub username of author |
| base_branch | Target branch |
| head_branch | Source branch |
| created_at | Pull request creation date |
| updated_at | Last update |
| merged_at | Merge date, if applicable |

### 3.11 Contributors

Stores GitHub contributor identities observed in connected repositories.

| Attribute | Description |
|---|---|
| id | Unique contributor identifier (Primary Key) |
| github_user_id | GitHub user ID, when available |
| github_username | GitHub username |
| avatar_url | GitHub profile image |
| created_at | Record creation date |
| updated_at | Last update |

A contributor does not necessarily need to be a registered DevCollab user.

### 3.12 Contribution Events

Stores observable GitHub contribution activity used for analytics.

| Attribute | Description |
|---|---|
| id | Unique event identifier (Primary Key) |
| repository_id | Associated repository (Foreign Key) |
| contributor_id | Associated contributor (Foreign Key) |
| event_type | Type of contribution activity |
| github_event_id | GitHub event identifier, when available |
| issue_id | Related issue (Foreign Key, optional) |
| pull_request_id | Related pull request (Foreign Key, optional) |
| occurred_at | Time of contribution |
| created_at | Record creation date |

Examples of observable events include pull request creation, pull request merging, issue creation, and issue closure.

### 3.13 Notifications

Stores notifications generated within DevCollab.

| Attribute | Description |
|---|---|
| id | Unique notification identifier (Primary Key) |
| user_id | Notification recipient (Foreign Key) |
| workspace_id | Related workspace (Foreign Key, optional) |
| type | Notification category |
| title | Notification title |
| message | Notification content |
| is_read | Read/unread status |
| created_at | Notification creation date |

### 3.14 Sync Runs

Tracks repository synchronization operations.

| Attribute | Description |
|---|---|
| id | Unique synchronization identifier (Primary Key) |
| repository_id | Associated repository (Foreign Key) |
| status | Pending, running, completed, or failed |
| sync_type | Initial or incremental synchronization |
| started_at | Synchronization start time |
| completed_at | Synchronization completion time |
| error_message | Error details, if synchronization fails |
| created_at | Record creation date |

### 3.15 Webhook Deliveries

Tracks incoming GitHub webhook deliveries.

| Attribute | Description |
|---|---|
| id | Unique delivery record identifier (Primary Key) |
| github_delivery_id | GitHub delivery ID, used for duplicate detection |
| installation_id | Associated GitHub App installation (Foreign Key, optional) |
| event_type | GitHub webhook event type |
| status | Received, processed, or failed |
| received_at | Event reception time |
| processed_at | Event processing time, if completed |

## 4. Database Relationships

The following relationships are planned.

| Relationship | Type | Explanation |
|---|---|---|
| User → GitHub Account | One-to-Many | A user may link multiple GitHub accounts |
| User → Workspace | One-to-Many | A user can create multiple workspaces |
| Workspace → Workspace Members | One-to-Many | A workspace can have multiple members |
| User → Workspace Members | One-to-Many | A user can belong to multiple workspaces |
| Workspace → Workspace Invitations | One-to-Many | A workspace can have multiple invitations |
| GitHub App Installation → Repositories | One-to-Many | An installation can provide access to multiple repositories |
| Workspace → Workspace Repositories | One-to-Many | A workspace can connect multiple repositories |
| Repository → Workspace Repositories | One-to-Many | A repository can be connected to multiple workspaces |
| Repository → Issues | One-to-Many | A repository can contain multiple issues |
| Repository → Pull Requests | One-to-Many | A repository can contain multiple pull requests |
| Repository → Contribution Events | One-to-Many | A repository can have multiple contribution events |
| Contributor → Contribution Events | One-to-Many | A contributor can generate multiple events |
| Issue → Contribution Events | One-to-Many | An issue can be associated with multiple events |
| Pull Request → Contribution Events | One-to-Many | A pull request can be associated with multiple events |
| User → Notifications | One-to-Many | A user can receive multiple notifications |
| Repository → Sync Runs | One-to-Many | A repository can have multiple synchronization runs |
| GitHub App Installation → Webhook Deliveries | One-to-Many | An installation can be associated with multiple webhook deliveries |

## 5. Important Database Design Decisions

### Primary Keys

Every main entity will have a unique primary key.

### Foreign Keys

Foreign keys will connect related records and maintain referential integrity.

### Unique Constraints

The following fields should have appropriate uniqueness constraints:

- User email, subject to account and email verification rules.
- GitHub user ID within the GitHub account identity model.
- GitHub installation ID.
- GitHub repository ID.
- GitHub issue ID.
- GitHub pull request ID.
- GitHub delivery ID.
- Workspace slug.

### Many-to-Many Relationships

Workspace and repository connections will use the `Workspace Repositories` junction entity.

Workspace membership will use the `Workspace Members` junction entity.

### Timestamps

Important entities will use creation and update timestamps to track changes.

### Data Security

- OAuth tokens must be encrypted before storage.
- Sensitive credentials must never be exposed to the frontend.
- Access to workspace and repository data must be authorized.
- GitHub permissions must be checked against GitHub's actual authorization model.

### GitHub as Source of Truth

DevCollab will store only the GitHub information required by its features.

Repository permissions, issues, pull requests, and other GitHub-native records remain authoritative on GitHub. Stored records are selected snapshots for application display and analytics.

## 6. Important Role and Permission Decisions

The six finalized application roles are:

1. Individual Developer
2. Team Owner
3. Team Member
4. Repository Maintainer
5. Open-Source Contributor
6. Platform Administrator

These roles do not all need to be stored as one global user role.

- Platform Administrator is a platform-level role.
- Team Owner and Team Member are workspace membership roles.
- Repository Maintainer status will be determined using GitHub repository permissions.
- Open-Source Contributor status will be based on observable contribution activity.
- Individual Developer describes a personal workspace/user context.

This avoids duplicating GitHub permissions or assigning every user one fixed role across the platform.

## 7. Analytics Data Strategy

Analytics will be calculated from observable GitHub activity.

Relevant data sources include:

- Contribution Events
- Issues
- Pull Requests
- Contributors
- Repository metadata

Analytics must describe measurable collaboration and contribution activity, not claim to measure a developer's personal productivity.

## 8. Conclusion

This database plan defines the main entities, their attributes, relationships, and important design decisions for DevCollab.

It provides the foundation for the next database design activities:

- Entity Relationship Diagram (ER Diagram).
- Detailed PostgreSQL schema using Prisma.

This is a planning document, not an implemented database schema.