# Maintenance Tracker App

**Author:** David Wise  
Computer Science Major (Cybersecurity Emphasis), Certificate in Cryptography and Cryptanalysis

---

## Overview

Maintenance Tracker App is a modern web application built with React, Node.js, and TypeScript, designed to help users efficiently organize, track, and manage maintenance tasks. Drawing on best practices in secure software development, this app provides a clean, intuitive interface for logging and categorizing tasks, with a foundation for rapid feature expansion.

**Core Features (v0.1 Beta):**
- **User Authentication:** Secure registration and login using JWT.
- **Task Management:** Create, view, update, and delete maintenance tasks.
- **Task Status Tracking:** Set and update status (Pending, In-Progress, Done) for each task. Filter and report by status in the UI and API.
- **Categories/Tags:** Assign tasks to categories such as plumbing, electrical, and more.
- **Database Security:** Persistent storage using SQLite and TypeORM, with parameterized queries to prevent SQL injection.


**Planned Features:**
- Due dates and notifications/reminders
- Task status tracking (pending, in-progress, done)
- Multi-user support

---

## Maintenance Task Log

### Overview

### How to Use
1. Log in to the app.
2. Navigate to the "Maintenance Task Log" section in the frontend.
3. Use the filter form to search by status (Pending, In-Progress, Done, All), category, date range, and page size.
4. Results are shown in a table with pagination controls.

**Endpoint:** `GET /api/tasks/completed`

**Query Parameters:**
- `category` (optional): Filter by category
- `from` (optional): Completed after this date
- `to` (optional): Completed before this date
- `status` (optional, default: "Done"): Filter by status (Pending, In-Progress, Done)
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 20): Results per page
- `sort` (optional, default: "desc"): Sort by completed date

**Response:**
```
{
   tasks: [
      {
      }
   total: number,
   page: number,
   pageSize: number
}
```

**Authentication:** JWT required in `Authorization` header.

---

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
   - Backend: Create a `.env` file with `JWT_SECRET=your_jwt_secret` for local development.
   - **Cloud Deployment:** Set environment variables (e.g., `JWT_SECRET`) securely in the Render or Vercel dashboard. Do NOT commit secrets to source control.
   - TypeORM and SQLite are pre-configured for development.

4. **Run the app locally:**  
   - Backend: `npm run dev` (auto-restarts with nodemon)
   - Frontend: `npm start`

5. **Cloud Deployment:**
   - **Render (Backend):**
     - Push your code to GitHub.
     - Create a new Web Service on Render, point to your backend folder/repo.
     - Set build command: `npm install && npm run build`
     - Set start command: `npm start`
     - Add environment variables (e.g., `JWT_SECRET`) in the Render dashboard.
     - Your backend will be available at `https://maintenance-tracker-app.onrender.com/` (or your Render URL).
   - **Vercel (Frontend):**
     - Import your frontend repo/folder in Vercel.
     - Vercel will auto-detect React and build with `npm run build`.
     - Set environment variables (if needed) in Vercel dashboard.
     - For API calls, use your Render backend URL in production.

6. **Testing:**  
   - Register and log in to create users.
   - Tasks are stored securely in the database.
   - Use the Completed Tasks Report to verify reporting and filtering features.

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
