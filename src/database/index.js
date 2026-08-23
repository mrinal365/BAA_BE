import { connectPostgres } from './postgress.js';
import { connectMongoDB } from './mongodb.js';

export const connectDatabases = async () => {
  console.log('Initializing database connections...');
  // connect both postgres and mongodb
  await Promise.all([
    connectPostgres(),
    connectMongoDB()
  ]);
};
