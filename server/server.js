require('dotenv').config();
const connectDB = require('./config/db');

connectDB();

console.log('Server file updated — Express app will be built in Step 2.3');