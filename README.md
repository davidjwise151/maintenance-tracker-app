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
