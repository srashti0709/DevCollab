# DevCollab — Dashboard Design

## 1. Design Overview

The DevCollab dashboard provides a centralized workspace for developers to manage GitHub repositories, issues, pull requests, contributions, and collaboration activity.

The dashboard supports two workspace types:
- Personal Workspace
- Team Workspace

Both use the same design system while displaying workspace-specific information.

## 2. Overall Layout

The dashboard consists of:

1. Left Sidebar — Main navigation.
2. Topbar — Search, notifications, theme and profile controls.
3. Main Content — Dashboard overview, statistics, charts and activity.
4. Workspace Switcher — Switch between personal and team workspaces.

The layout will be responsive and support light and dark themes.

## 3. Sidebar Navigation

### Main Navigation
- Overview
- Repositories
- Issues
- Pull Requests
- Analytics
- Contributors
- Notifications

### Team Navigation
- Team Members
- Invitations
- Team Settings

### Bottom Navigation
- Documentation
- Preferences
- Profile
- Logout

### Sidebar Behaviour
- Collapsible sidebar.
- Active navigation item highlighted in indigo.
- Notification badges where relevant.
- Navigation items displayed according to user permissions.
- Theme-aware appearance.

## 4. Topbar

The topbar contains:
- Breadcrumb navigation.
- Global search.
- Notifications icon with unread indicator.
- Light/dark theme switcher.
- User profile menu.

Additional behaviour:
- Fixed top navigation.
- Keyboard shortcut Ctrl + K for global search.
- Responsive layout for smaller screens.

## 5. Dashboard Overview

### Welcome Section
Displays:
- Welcome message.
- GitHub username and avatar.
- Current workspace name.
- Quick actions.

Quick actions:
- Connect Repository.
- Create Team.

### Statistics Cards

Four main statistics:

1. Total Repositories
2. Open Issues
3. Open Pull Requests
4. Contributors

All values must come from actual GitHub data and authorized resources.

### Recent Repositories

Displays:
- Repository name.
- Description.
- Primary programming language.
- Stars and forks.
- Recent activity.
- Link to repository details.

### Contribution Activity

Displays a GitHub-style contribution heatmap showing activity across days.

### Commit Activity

A line chart showing commit activity over a selected period.

### Issue and Pull Request Distribution

A donut chart showing the distribution of issues and pull requests by status.

### Repository Activity

A bar chart comparing observable activity across selected repositories.

## 6. Chart Controls

Charts should support:
- 7-day range.
- 30-day range.
- 90-day range.
- Custom date range.
- Repository filters where relevant.
- Workspace filters where relevant.
- Tooltips with exact values.
- Loading and empty states.
- Light and dark themes.

Charts must represent measurable GitHub events rather than invented productivity scores.

## 7. Recent Activity Feed

Displays recent GitHub events such as:
- Commits pushed.
- Issues opened or closed.
- Pull requests created or merged.
- Reviews submitted.
- Comments added.

Each activity item includes:
- Developer avatar.
- Username.
- Activity type.
- Repository name.
- Activity description.
- Timestamp.
- Link to the original GitHub activity.

## 8. Pending Work

Displays work requiring attention.

### Issues
- Assigned open issues.
- Issue title and repository.
- Labels and priority where available.

### Pull Requests
- Pull requests awaiting review.
- Pull request title and repository.
- Current status.

### Reviews
- Review requests awaiting action.
- Repository and pull request details.

Information must follow GitHub permissions and actual assignments.

## 9. Personal Workspace

The Personal Workspace displays:
- Connected personal repositories.
- Personal issues and pull requests.
- Individual contribution activity.
- Assigned reviews.
- Personal GitHub analytics.
- Recent personal activity.

## 10. Team Workspace

The Team Workspace displays:
- Team repositories.
- Team issues and pull requests.
- Contributor activity.
- Team-wide analytics.
- Pending reviews and collaboration activity.
- Team members and invitations.

Team-wide information must only be visible to authorized users.

## 11. Workspace Switching

Users can switch between Personal and Team Workspaces without logging in again.

Rules:
- Personal and team data remain separate.
- Team owners receive additional management controls.
- Repository maintainers receive controls for repositories they are authorized to manage.
- Other users see features according to their permissions.

## 12. Responsive Design

### Desktop
- Full sidebar.
- Complete dashboard layout.
- Multiple statistic cards in a row.
- Charts displayed in a grid.

### Tablet
- Collapsible sidebar.
- Adjusted chart grid.
- Responsive statistic cards.

### Mobile
- Sidebar becomes a navigation drawer.
- Single-column dashboard layout.
- Stacked statistic cards and charts.
- Responsive tables and activity feed.

## 13. Design Principles

- Consistent with the DevCollab design system.
- Modern developer-tool aesthetic inspired by Linear, GitHub and Vercel.
- Indigo, violet and teal accent colors.
- Inter typography.
- Clear information hierarchy.
- Accessible contrast and readable text.
- Consistent loading, empty and error states.

## 14. Data and Permission Rules

- GitHub remains the source of truth.
- Dashboard statistics must be derived from actual GitHub data.
- Users must only see repositories and information they are authorized to access.
- Team information must respect applicable permissions.
- Analytics describe observable GitHub activity, not personal productivity.
- AI-generated recommendations must be explainable.

---


