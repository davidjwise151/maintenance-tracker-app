# Maintenance Tracker App

**Author:** David Wise  
Computer Science Major (Cybersecurity Emphasis), Certificate in Cryptography and Cryptanalysis

---

## Overview

Maintenance Tracker App is a modern web application built with React, Node.js, and TypeScript, designed to help users efficiently organize, track, and manage maintenance tasks. Drawing on best practices in secure software development, this app provides a clean, intuitive interface for logging and categorizing tasks, with a foundation for rapid feature expansion.

**Core Features (v0.1 Beta):**
- **User Authentication:** Secure registration and login using JWT.
- **Task Management:** Create, view, update, and delete maintenance tasks.
- **Categories/Tags:** Assign tasks to categories such as plumbing, electrical, and more.
- **Database Security:** Persistent storage using SQLite and TypeORM, with parameterized queries to prevent SQL injection.

**Planned Features:**
- Due dates and notifications/reminders
- Task status tracking (pending, in-progress, done)
- Reporting and history views
- Multi-user support

This project demonstrates fast, iterative development with a focus on code quality, usability, and security. Feature requests and feedback are welcome as the app evolves!

---

## Tech Stack

- **Frontend:** React (TypeScript)
- **Backend:** Node.js, Express (TypeScript)
- **Authentication:** JWT
- **Database:** SQLite with TypeORM (secure, persistent storage)
- **Deployment:** Cloud (Vercel, Heroku, etc.)

---

## Setup & Usage

1. **Install dependencies:**  
   Run `npm install` in both `backend` and `frontend` directories.

2. **Database:**  
   The backend uses SQLite (`dev.db`) via TypeORM.  
   No manual setup required for local development.

3. **Environment Variables:**  
   - Backend: Create a `.env` file with `JWT_SECRET=your_jwt_secret`
   - TypeORM and SQLite are pre-configured for development.

4. **Run the app:**  
   - Backend: `npm run dev` (auto-restarts with nodemon)
   - Frontend: `npm start`

5. **Testing:**  
   - Register and log in to create users.
   - Tasks are stored securely in the database.

---

## Developer Notes

- **Backend Structure:**  
  - `src/entity/`: TypeORM models (User, Task)
  - `src/routes/`: Express route handlers (auth, tasks)
  - `src/data-source.ts`: TypeORM configuration
  - `src/app.ts`: Express app setup
  - `src/server.ts`: Server entry point

- **Adding Features:**  
  - Create new entities in `src/entity/`
  - Add new routes in `src/routes/`
  - Use TypeORM for all database access

- **Security:**  
  - All queries use TypeORM (parameterized, prevents SQL injection)
  - Passwords are hashed with bcrypt
  - JWT used for authentication
  - Input validated with express-validator

- **Development:**  
  - Use `npm run dev` for backend (nodemon auto-restarts)
  - Use VS Code SQLite extension to inspect `dev.db`

---

## License

This project is open source under the MIT License.

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

Built and maintained by [David Wise](https://github.com/davidjwise151), Boise State University Computer Science graduate passionate about secure, efficient, and user-centered software.
