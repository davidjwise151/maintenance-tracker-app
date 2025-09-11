const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Example API route
import { Request, Response } from 'express';

app.get('/api/hello', (req: Request, res: Response) => {
  res.json({ message: 'Hello from backend!' });
});

// Other middleware/routes ...

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});