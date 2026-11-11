# DevCollab — Authentication Page Design

## 1. Authentication Approach

- Authentication: GitHub OAuth
- Repository access: GitHub App
- Session management: Secure server-managed sessions
- Primary login method: Continue with GitHub
- No traditional email/password login in the initial version.

Authentication and repository authorization are separate processes.

## 2. Login Page

Elements:
- DevCollab logo
- Welcome heading
- Short product description
- Continue with GitHub button
- Terms of Service link
- Privacy Policy link

**Heading:** Welcome to DevCollab

**Description:** Sign in securely using your GitHub account.

**Primary Button:** Continue with GitHub

Visual direction:
- Clean split-screen layout.
- Branding and dashboard preview on one side.
- Login panel on the other side.
- Indigo and violet accents.

## 3. GitHub Authorization

### Step 1: Authentication
The user selects Continue with GitHub and completes OAuth authorization.

### Step 2: GitHub App Installation
The user installs the DevCollab GitHub App on a personal account or organization and selects the repositories it can access.

### Step 3: Permission Review
Explain requested permissions clearly before installation.

Permission principles:
- Request minimum necessary access.
- Prefer read-only permissions wherever possible.
- Avoid unrelated repository access.
- Respect GitHub organization policies.
- Allow access management through GitHub.

Final permissions depend on implemented features.

## 4. First-Time Onboarding

### Screen 1: Welcome
Display GitHub username and profile picture.

### Screen 2: Workspace Selection
Options:
- Personal Workspace
- Team Workspace

### Screen 3: Repository Connection
Allow users to select repositories available through their GitHub App installation.

### Screen 4: Preferences
Allow users to configure:
- Light or dark theme
- Notification preferences
- Dashboard defaults

### Screen 5: Dashboard
Complete onboarding and enter the selected workspace.

Onboarding principles:
- Optional preferences can be skipped.
- Repository connection can be completed later.
- Team creation is optional.
- Settings can be changed later.

## 5. Authentication Error States

| Situation | User Message |
|---|---|
| Login cancelled | Login was cancelled. Try again. |
| Authorization failed | We couldn't verify your GitHub account. |
| GitHub unavailable | GitHub is temporarily unavailable. |
| Access denied | Required permissions were not granted. |
| Installation incomplete | Complete the GitHub App installation. |
| Access revoked | Reconnect your GitHub account. |
| Session expired | Your session expired. Sign in again. |

Every error screen should provide:
- Clear explanation
- Relevant icon or illustration
- Retry or reconnect action
- Helpful next step

Never display raw technical errors or stack traces.

## 6. Security and Privacy

- Use secure OAuth flows with state validation and PKCE where supported.
- Store tokens securely on the server.
- Use secure, HTTP-only, SameSite cookies for sessions.
- Never expose access tokens in frontend code.
- Enforce authorization on the backend.
- Respect GitHub permissions and repository access.
- Support logout and account disconnection.
- Do not collect unnecessary personal information.

## 7. Navigation Flow

Login Page → GitHub OAuth → GitHub App Installation → Workspace Selection → Repository Connection → Preferences → Main Dashboard.

Returning users with an active session can go directly to their permitted workspace.

## 8. Design Guidelines

- Consistent DevCollab branding.
- Inter typography.
- Indigo and violet accents.
- Rounded buttons and form elements.
- Clear loading and error states.
- Responsive split-screen login layout.
- Accessible keyboard and focus states.
- Consistent light and dark themes.