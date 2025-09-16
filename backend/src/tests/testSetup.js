// Ensure .env is loaded for all tests
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
