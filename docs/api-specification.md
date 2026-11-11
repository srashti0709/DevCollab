# DevCollab — REST API Specification

## 1. Introduction

This document defines the planned REST API endpoints for DevCollab.

The backend will use Node.js and Express.js. The frontend will communicate with it using HTTPS requests.

**Base URL (planned):**

```text
/api/v1
```

All endpoints in this document are planned, not implemented.

## 2. API Conventions

### HTTP Methods

| Method | Purpose |
|---|---|
| GET | Retrieve information |
| POST | Create a resource or trigger an operation |
| PATCH | Partially update a resource |
| PUT | Replace a resource |
| DELETE | Remove or disconnect a resource |

### Response Format

Successful responses will follow a consistent structure.

Example:

```json
{
  "success": true,
  "message": "Repositories retrieved successfully",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Resource not found",
  "error": {
    "code": "RESOURCE_NOT_FOUND"
  }
}
```

### Authentication

- Protected endpoints require an authenticated DevCollab user.
- Authentication will use a secure server-managed session or equivalent secure authentication mechanism established through GitHub OAuth.
- Workspace and repository access must be authorized separately.
- GitHub permissions must be checked against GitHub's actual permission model.

### Pagination

List endpoints will support pagination using:

```text
?page=1&limit=20
```

Additional query filters may be provided where required.

## 3. Authentication APIs

Base path: `/api/v1/auth`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/github` | Start GitHub OAuth login | Public |
| GET | `/github/callback` | Handle GitHub OAuth callback | Public |
| GET | `/me` | Retrieve current user | Authenticated |
| POST | `/logout` | Log out current user | Authenticated |

## 4. Workspace APIs

Base path: `/api/v1/workspaces`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/` | Create workspace | Authenticated |
| GET | `/` | List user's workspaces | Authenticated |
| GET | `/:workspaceId` | Retrieve workspace details | Workspace member |
| PATCH | `/:workspaceId` | Update workspace | Workspace owner |
| DELETE | `/:workspaceId` | Delete workspace | Workspace owner |
| GET | `/:workspaceId/members` | List workspace members | Workspace member |
| PATCH | `/:workspaceId/members/:memberId` | Update member role | Workspace owner |
| DELETE | `/:workspaceId/members/:memberId` | Remove member | Authorized workspace user |
| POST | `/:workspaceId/invitations` | Invite a member | Workspace owner |
| GET | `/:workspaceId/invitations` | List invitations | Workspace owner |
| POST | `/invitations/:invitationId/accept` | Accept invitation | Authenticated invited user |
| DELETE | `/invitations/:invitationId` | Revoke invitation | Workspace owner |

## 5. GitHub App and Repository APIs

Base path: `/api/v1`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/github/installations` | List available installation information | Authenticated |
| GET | `/github/installations/callback` | Handle GitHub App installation callback | Authenticated |
| GET | `/workspaces/:workspaceId/repositories` | List connected repositories | Workspace member |
| POST | `/workspaces/:workspaceId/repositories` | Connect a repository | Authorized workspace user |
| GET | `/repositories/:repositoryId` | Retrieve repository details | Authorized user |
| PATCH | `/repositories/:repositoryId` | Update application-specific repository settings | Authorized user |
| DELETE | `/workspaces/:workspaceId/repositories/:repositoryId` | Disconnect repository from workspace | Authorized workspace user |
| POST | `/repositories/:repositoryId/sync` | Request repository synchronization | Authorized user |
| GET | `/repositories/:repositoryId/sync-runs` | Retrieve synchronization history | Authorized user |

Disconnecting a repository from a workspace does not delete the original GitHub repository.

## 6. Issue APIs

Base path: `/api/v1`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/repositories/:repositoryId/issues` | List repository issues | Authorized user |
| GET | `/issues/:issueId` | Retrieve issue details | Authorized user |
| GET | `/issues/:issueId/activity` | Retrieve related contribution activity | Authorized user |

Issue creation, editing, assignment, and closure will be handled through GitHub-authorized operations if included in the final feature scope.

## 7. Pull Request APIs

Base path: `/api/v1`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/repositories/:repositoryId/pull-requests` | List pull requests | Authorized user |
| GET | `/pull-requests/:pullRequestId` | Retrieve pull request details | Authorized user |
| GET | `/pull-requests/:pullRequestId/activity` | Retrieve related activity | Authorized user |

GitHub will remain authoritative for pull request status and permissions.

Consequential actions such as approving or merging pull requests will not be performed autonomously by AI.

## 8. Analytics APIs

Base path: `/api/v1/analytics`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/developer` | Retrieve individual developer analytics | Authorized user |
| GET | `/team/:workspaceId` | Retrieve team analytics | Workspace member |
| GET | `/repository/:repositoryId` | Retrieve repository analytics | Authorized user |
| GET | `/contributions` | Retrieve contribution trends | Authorized user |
| GET | `/languages` | Retrieve programming language statistics | Authorized user |
| GET | `/collaboration` | Retrieve collaboration insights | Authorized user |

Analytics will be based on observable GitHub activity, not claims about personal productivity.

Optional filters may include:

- `startDate`
- `endDate`
- `repositoryId`
- `workspaceId`
- `groupBy`

## 9. Contributor APIs

Base path: `/api/v1`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/repositories/:repositoryId/contributors` | List repository contributors | Authorized user |
| GET | `/contributors/:contributorId` | Retrieve contributor details | Authorized user |
| GET | `/contributors/:contributorId/activity` | Retrieve contributor activity | Authorized user |

Contributor records may represent GitHub users who have never registered with DevCollab.

## 10. Notification APIs

Base path: `/api/v1/notifications`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/` | List current user's notifications | Authenticated |
| GET | `/:notificationId` | Retrieve notification details | Notification owner |
| PATCH | `/:notificationId/read` | Mark notification as read | Notification owner |
| PATCH | `/read-all` | Mark all notifications as read | Authenticated |
| DELETE | `/:notificationId` | Delete notification | Notification owner |

## 11. Synchronization APIs

Base path: `/api/v1/sync`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/runs/:syncRunId` | Retrieve synchronization status | Authorized user |
| GET | `/repositories/:repositoryId/runs` | Retrieve repository synchronization history | Authorized user |

Synchronization jobs will run in the background through BullMQ. API requests will return job or synchronization identifiers rather than waiting for long-running work to finish.

## 12. GitHub Webhook API

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/api/v1/webhooks/github` | Receive GitHub webhook events | GitHub signature verification |

Webhook requests will not use normal user-session authentication.

The backend will:

1. Verify the GitHub webhook signature.
2. Check the delivery identifier for duplicates.
3. Identify the event type.
4. Record the delivery.
5. Queue the required background processing.

## 13. Admin APIs

Base path: `/api/v1/admin`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/overview` | Retrieve platform overview | Platform administrator |
| GET | `/users` | List platform users | Platform administrator |
| GET | `/users/:userId` | Retrieve user details | Platform administrator |
| PATCH | `/users/:userId/status` | Update platform account status | Platform administrator |
| GET | `/sync-runs` | View platform synchronization activity | Platform administrator |
| GET | `/webhook-deliveries` | View webhook processing records | Platform administrator |

Platform administrators will not automatically receive access to private GitHub repositories or their contents.

## 14. Example API Requests and Responses

### Example 1: Retrieve Current User

**Request**

```http
GET /api/v1/auth/me
```

**Response**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "user-uuid",
    "name": "Developer Name",
    "email": "developer@example.com",
    "githubUsername": "developer"
  }
}
```

### Example 2: Create Workspace

**Request**

```http
POST /api/v1/workspaces
Content-Type: application/json
```

**Body**

```json
{
  "name": "My Development Team",
  "type": "TEAM"
}
```

**Response**

```json
{
  "success": true,
  "message": "Workspace created successfully",
  "data": {
    "id": "workspace-uuid",
    "name": "My Development Team",
    "type": "TEAM"
  }
}
```

### Example 3: Retrieve Repository Issues

**Request**

```http
GET /api/v1/repositories/repository-uuid/issues?page=1&limit=20
```

**Response**

```json
{
  "success": true,
  "message": "Issues retrieved successfully",
  "data": [
    {
      "id": "issue-uuid",
      "title": "Improve authentication flow",
      "state": "OPEN",
      "issueNumber": 12
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

## 15. Standard HTTP Status Codes

| Status Code | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Resource created |
| 204 | Request successful with no response body |
| 400 | Invalid request |
| 401 | Authentication required |
| 403 | Access denied |
| 404 | Resource not found |
| 409 | Resource conflict |
| 422 | Validation error |
| 429 | Too many requests |
| 500 | Internal server error |
| 502 | External service error |

## 16. API Security Rules

1. Protected endpoints require authentication.
2. Workspace access must be checked before returning workspace data.
3. Repository access must respect GitHub App permissions.
4. Input validation will use Zod.
5. Sensitive tokens must never be returned in API responses.
6. Webhook signatures must be verified.
7. Rate limiting should protect sensitive and frequently accessed endpoints.
8. Error responses must not expose internal stack traces or secrets.
9. Administrative endpoints require platform administrator authorization.
10. AI-related features must not bypass normal authorization checks.

## 17. Conclusion

This API specification defines how the DevCollab frontend will communicate with its backend.

It establishes consistent endpoint naming, request methods, access requirements, response formats, and security rules.

The endpoints are a planning contract and may be refined during implementation without changing the overall architecture unnecessarily.