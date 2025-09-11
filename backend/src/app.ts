import express from 'express';
import cors from 'cors';

// Placeholder for routes and middleware
const app = express();


app.use(cors());
app.use(express.json());

// Hello World API route
app.get('/api/hello', (req, res) => {
	res.json({ message: 'Hello from backend!' });
});

// Future: Add authentication middleware here

// Maintenance tasks routes
// TODO: Implement CRUD endpoints for tasks

// Placeholder: Due dates, notifications, status tracking, reporting, multi-user support

export default app;