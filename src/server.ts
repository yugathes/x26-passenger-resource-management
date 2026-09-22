import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './db/prisma';

export const startServer = async (): Promise<void> => {
  await prisma.$connect();
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
    console.log(`Health check: http://localhost:${env.port}/health`);
  });

  const shutdown = async (): Promise<void> => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
};