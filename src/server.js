import app from './app.js';
import { connectDatabases } from './database/index.js';

const PORT = process.env.PORT || 5000;

// Connect to databases and start server
const startServer = async () => {
  try {
    await connectDatabases();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
