# Maintainer

**Author:** David Wise  
Computer Science Major (Cybersecurity Emphasis), Certificate in Cryptography and Cryptanalysis

---

## Overview

Maintainer is a modern web application built with React, Node.js, and TypeScript, designed to help users efficiently organize, track, and manage maintenance tasks. Drawing on best practices in secure software development, this app provides a clean, intuitive interface for logging and categorizing tasks, with a foundation for rapid feature expansion.


**Core Features (v0.1 Beta):**
- User Authentication (JWT)
- Task Management (CRUD)
- Task Status Tracking (Pending, In-Progress, Done)
- Categories/Tags
- Database Security (SQLite, TypeORM)
- Modern UI/UX (responsive, filtering, pagination, toast notifications)

---

## Quick Start

1. **Install dependencies:**
   - Run `npm install` in both `backend` and `frontend` directories.
2. **Database:**
   - Backend uses SQLite (`dev.db`) via TypeORM. No manual setup required for local development.
3. **Environment Variables:**
   - Backend: Create a `.env` file with `JWT_SECRET=your_jwt_secret` for local development.
   - Frontend: Set `REACT_APP_API_URL` to your backend URL.
4. **Run the app locally:**
   - Backend: `npm run dev`
   - Frontend: `npm start`
5. **Cloud Deployment:**
   - Backend: Render
   - Frontend: Vercel

---

## Tech Stack

- Frontend: React (TypeScript)
- Backend: Node.js, Express (TypeScript)
- Authentication: JWT
- Database: SQLite with TypeORM
- Deployment: Vercel (frontend), Render (backend)

---


## Environment & Deployment

- **Frontend (Vercel):** Set `REACT_APP_API_URL` in the dashboard to your backend URL. Vercel injects env vars at build time.
- **Backend (Render):** Set `JWT_SECRET` and other secrets in the dashboard. Never commit secrets to source control.

---



## Roles & Permissions

Maintainer supports robust multi-user access with role-based permissions:

- **Roles:**
   - `admin`: Full access to all features, including user management, task assignment, and deletion.
   - `user`: Can create, view, and update their own tasks; cannot manage other users or assign/delete tasks unless owner.

- **Permissions:**
   - Only admins can list all users, change user roles, and assign tasks to any user.
   - Task owners can assign tasks they own and delete their own tasks.
   - Only assignees can accept assigned tasks.
   - All sensitive backend routes are protected by JWT authentication and role checks.
   - Frontend UI hides admin-only features from regular users and surfaces permission errors via toast notifications.

- **Security Model:**
   - JWT-based authentication for all API requests.
   - Passwords securely hashed with bcrypt.
   - Role-based authorization enforced in backend and reflected in frontend UI.
   - Audit logging for admin actions (role changes, assignment, deletion) for traceability.

- **Admin Account Seeding:**
   - The first registered user can be assigned the `admin` role if no admin exists.
   - Admins can promote/demote users via the User Management UI.

---
## Project Structure

**Backend:**
- `src/entity/`: TypeORM models (User, Task)
- `src/routes/`: Express route handlers (auth, tasks)
- `src/data-source.ts`: TypeORM configuration
- `src/app.ts`: Express app setup
- `src/server.ts`: Server entry point

**Frontend:**
- `src/`: Main React components
- `public/`: Static assets and HTML
- `build/`: Production build output

---

## License

MIT License

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

Built and maintained by [David Wise](https://github.com/davidjwise151).
