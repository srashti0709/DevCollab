# DevCollab — Project Folder Structure

## 1. Introduction

DevCollab will use a structured folder organization to keep frontend and backend code separate, maintainable, and easy to expand.

The project will have two main applications:

- `frontend` — React + JavaScript + Vite
- `backend` — Node.js + Express.js + JavaScript

Both applications will be maintained inside one Git repository.

## 2. Root Project Structure

```text
DevCollab/
│
├── frontend/
├── backend/
├── docs/
├── .gitignore
└── README.md
```

| Folder/File | Purpose |
|---|---|
| frontend | Contains the React frontend application |
| backend | Contains the Express backend application |
| docs | Contains project planning and technical documentation |
| .gitignore | Specifies files Git should ignore |
| README.md | Explains the project and how to use it |

## 3. Frontend Folder Structure

```text
frontend/
│
├── public/
│
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── navigation/
│   │   └── ui/
│   │
│   ├── pages/
│   │   ├── landing/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── repositories/
│   │   ├── issues/
│   │   ├── pull-requests/
│   │   ├── analytics/
│   │   ├── contributors/
│   │   ├── notifications/
│   │   └── settings/
│   │
│   ├── features/
│   │   ├── authentication/
│   │   ├── repositories/
│   │   ├── issues/
│   │   ├── pull-requests/
│   │   ├── analytics/
│   │   ├── contributors/
│   │   └── notifications/
│   │
│   ├── hooks/
│   ├── services/
│   ├── routes/
│   ├── context/
│   ├── utils/
│   ├── config/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
│
├── index.html
├── package.json
└── vite.config.js
```

### Frontend Folder Responsibilities

| Folder | Responsibility |
|---|---|
| public | Static files served directly |
| assets | Images, icons, fonts, and other assets |
| components | Reusable UI components |
| components/common | Shared components used across pages |
| components/layout | Application layouts and page structures |
| components/navigation | Sidebar, navbar, and navigation elements |
| components/ui | Reusable interface components, including shadcn/ui components |
| pages | Main application pages |
| features | Feature-specific UI and logic |
| hooks | Custom React hooks |
| services | API communication functions |
| routes | Route definitions and route protection |
| context | React context providers |
| utils | Reusable helper functions |
| config | Frontend configuration |
| styles | Global styles and styling configuration |

### Frontend Design Principle

The frontend will follow a feature-oriented structure.

Reusable components will remain in `components`, while feature-specific code will be grouped inside `features`.

TanStack Query will manage server state and API caching.

## 4. Backend Folder Structure

```text
backend/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── config/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── repositories/
│   │   ├── issues/
│   │   ├── pull-requests/
│   │   ├── analytics/
│   │   ├── contributors/
│   │   ├── notifications/
│   │   ├── synchronization/
│   │   └── admin/
│   │
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── integrations/
│   │   └── github/
│   │
│   ├── queues/
│   ├── workers/
│   ├── utils/
│   ├── validators/
│   ├── app.js
│   └── server.js
│
├── tests/
├── .env.example
├── package.json
└── Dockerfile
```

### Backend Folder Responsibilities

| Folder/File | Responsibility |
|---|---|
| prisma | Prisma schema and database migrations |
| config | Application configuration and environment setup |
| modules | Nine independent application modules |
| middlewares | Authentication, authorization, error handling, and other request middleware |
| routes | Main API route registration |
| services | Shared business services |
| integrations | External service integrations |
| integrations/github | GitHub API communication through Octokit |
| queues | BullMQ queue definitions and job scheduling |
| workers | Background job processors |
| utils | Shared helper functions |
| validators | Request and data validation using Zod |
| app.js | Express application configuration and middleware registration |
| server.js | Starts the backend server |
| tests | Backend test files |

## 5. Internal Module Structure

Each major backend module will follow a consistent internal organization.

Example: Repositories module.

```text
repositories/
│
├── repository.routes.js
├── repository.controller.js
├── repository.service.js
├── repository.repository.js
└── repository.validation.js
```

| File | Responsibility |
|---|---|
| repository.routes.js | Defines repository API endpoints |
| repository.controller.js | Handles incoming requests and responses |
| repository.service.js | Contains repository-related business logic |
| repository.repository.js | Handles database queries through Prisma |
| repository.validation.js | Validates incoming repository data |

The same organizational pattern will be considered for other backend modules, adapting it when a module has different requirements.

## 6. Important Architectural Rules

1. Frontend and backend code must remain separate.
2. Frontend components should be reusable wherever practical.
3. Feature-specific frontend functionality should remain grouped by feature.
4. Backend business logic should be organized into modules.
5. Controllers should handle HTTP requests and responses, not contain large business logic implementations.
6. Services should contain business logic.
7. Database access should be handled through Prisma.
8. GitHub API communication should be centralized through the GitHub integration layer.
9. Background jobs should be handled through BullMQ queues and workers.
10. Environment secrets must not be committed to Git.
11. JavaScript will be used throughout the project; TypeScript is not part of the selected stack.

## 7. Conclusion

This folder structure provides a clear separation between frontend presentation, backend business logic, database access, external integrations, and background processing.

It follows the Modular Monolith architecture while keeping the project organized for future expansion.

This document defines the planned folder organization. It does not mean that these folders or files have already been implemented.