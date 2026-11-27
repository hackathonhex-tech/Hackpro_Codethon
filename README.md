# Codeathon Platform

A production-ready, full-stack competitive programming contest platform supporting 500+ concurrent students.

## Architecture

```
codeathon/
├── backend/                   # Node.js (ESM) + Express + Socket.IO
├── frontend/
│   ├── student-web/           # Next.js 14 — Student Portal (port 3000)
│   └── admin-web/             # Next.js 14 — Admin Panel (port 3001)
└── packages/
    ├── shared/                # Zod schemas, constants, shared types
    ├── ui-tokens/             # Tailwind design tokens (Sapphire Blue)
    ├── tsconfig/              # Shared TypeScript configs
    └── eslint-config/         # Shared ESLint config
```

### Backend Modules (13)
Auth · Users · Roles · Contests · Sections · Questions · Rubrics ·
Participants · Teams · Assignments · Attempts · Submissions · Proctoring ·
Leaderboard · Attendance · Analytics · Reports · Audit Logs

### Key Design Decisions
- **In-memory fallbacks**: Platform works without MongoDB or Redis
- **In-House Compiler Engine**: Native execution for Python, Java, C#, and JavaScript with Pyodide Wasm browser execution
- **Server-authoritative timer**: `endsAt = min(start+duration+extension, contestEnd+grace)`
- **Hidden test cases**: I/O never sent to client — only pass/fail count
- **MCQ security**: Correct answers stripped before sending to students
- **Refresh token rotation**: Old token revoked on use; reuse = all sessions revoked
- **Report override layer**: Separate collection stores `realStats` and `displayStats`

## Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install
```bash
npm install
```

### Environment
```bash
# Backend
cp backend/.env.example backend/.env

# Student web
cp frontend/student-web/.env.example frontend/student-web/.env.local

# Admin web
cp frontend/admin-web/.env.example frontend/admin-web/.env.local
```

### Seed Database
```bash
npm run seed
```

This creates:
- Super Admin: `superadmin@codeathon.dev` / `SuperAdmin@2026!`
- 3 predefined rubrics (Balanced, Accuracy-First, Speed-First)
- Sample contest with 2 participants and 1 team

### Development

Run all services concurrently:
```bash
npm run dev
```

Or individually:
```bash
npm run dev:backend      # Port 5000
npm run dev:student      # Port 3000
npm run dev:admin        # Port 3001
```

### Tests
```bash
npm --workspace=codeathon-backend test
# 13 tests, 3 suites — all pass
```

### Build
```bash
npm run build
```

## Default Credentials

| Role        | Identifier                   | Password          |
|-------------|------------------------------|-------------------|
| Super Admin | `superadmin@codeathon.dev`   | `SuperAdmin@2026!`|
| Student     | `CS2026001`                  | `Student@2026!`   |

## API Documentation

Swagger UI: `http://localhost:5000/api-docs`

Base URL: `http://localhost:5000/api/v1`

Postman collection: `backend/postman/codeathon.postman_collection.json`

## Environment Variables

### Backend (`backend/.env`)
| Variable             | Default                      | Description              |
|----------------------|------------------------------|--------------------------|
| `PORT`               | `5000`                       | Server port              |
| `MONGO_URI`          | (required)                   | MongoDB connection string |
| `REDIS_URL`          | `redis://localhost:6379`     | Redis connection string  |
| `JWT_ACCESS_SECRET`  | (required)                   | JWT access signing secret |
| `JWT_REFRESH_SECRET` | (required)                   | JWT refresh signing secret |
| `BREVO_API_KEY`      | (optional)                   | Brevo SMTP API key       |
| `NODE_ENV`           | `development`                | Environment              |

### Student Web (`frontend/student-web/.env.local`)
| Variable                  | Default                        |
|---------------------------|--------------------------------|
| `NEXT_PUBLIC_API_URL`     | `http://localhost:5000/api/v1` |
| `NEXT_PUBLIC_WS_URL`      | `http://localhost:5000`        |

### Admin Web (`frontend/admin-web/.env.local`)
| Variable                  | Default                        |
|---------------------------|--------------------------------|
| `NEXT_PUBLIC_API_URL`     | `http://localhost:5000/api/v1` |
| `NEXT_PUBLIC_WS_URL`      | `http://localhost:5000`        |

## Ports

| Service       | Port |
|---------------|------|
| Backend API   | 5000 |
| Student Web   | 3000 |
| Admin Web     | 3001 |

## Feature Overview

### Student Portal
- Login with roll number or email
- Dashboard listing assigned contests with status
- Contest entry page with instructions and proctoring warnings
- Full exam interface: timer, section nav, MCQ, code editor, run & submit
- Results page with score breakdown and leaderboard

### Admin Panel
- Dashboard with analytics, score distribution, top performers
- Contest management: create, edit, duplicate, adjust timing
- Contest detail: sections + questions (MCQ & coding) editor
- Participant management with bulk CSV import/export
- Team creation and member assignment
- Contest assignments (participants & teams)
- Rubric management (3 predefined + custom with weight validation)
- Attendance roster with status filtering and CSV export
- Live proctoring monitor with real-time violation feed
- Leaderboard view with freeze support
- Reports with display override layer and CSV export
- Submission control with Super Admin revoke
- User management (Super Admin only)
- Role & permission matrix (Super Admin only)
- Audit log viewer

## Security

- JWT access tokens (15min) + HttpOnly refresh tokens (7d)
- RBAC with 30+ granular permissions across 13 modules
- Rate limiting: global 100rpm, auth 10rpm, code-run 20rpm
- Hidden test case I/O never exposed to students
- MCQ correct answers stripped server-side
- Proctoring event logging with configurable auto-submit threshold
