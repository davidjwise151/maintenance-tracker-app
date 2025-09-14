import { AppDataSource } from "./data-source";
import app from './app';

/**
 * Entry point for starting the Express server.
 * - Initializes TypeORM data source
 * - Starts Express server on configured port
 * - Handles startup errors gracefully
 */
const PORT = process.env.PORT || 5000;

AppDataSource.initialize()
  .then(() => {
    console.log('Backend using database at path:', process.env.DB_PATH);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("TypeORM initialization error:", error);
    process.exit(1);
  });