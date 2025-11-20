import app from './app.js';
import './config/env.js';
import prisma from './prisma/client.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (process.env.DATABASE_URL) {
      await prisma.$connect();
    } else {
      console.warn('DATABASE_URL not set, skipping Prisma connection.');
    }
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to database', error);
    process.exit(1);
  }
}

startServer();
