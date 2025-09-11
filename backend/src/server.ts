import app from './app';

/**
 * Entry point for starting the Express server.
 * Listens on the port defined in environment variables or defaults to 5000.
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});