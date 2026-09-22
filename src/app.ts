import express, { Application, NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { prisma } from './db/prisma';
import { HttpError } from './lib/http-error';
import { passengerRouter } from './modules/passengers/passenger.routes';
import { resourceRouter } from './modules/resources/resource.routes';
import { accessRouter } from './modules/access/access.routes';
import { crewLeadRouter } from './modules/crew-leads/crew-lead.routes';
import { reportsRouter } from './modules/reports/reports.routes';

export const createApp = (): Application => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        environment: process.env.NODE_ENV ?? 'development'
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.use('/passengers', passengerRouter);
  app.use('/resources', resourceRouter);
  app.use('/access', accessRouter);
  app.use('/crew-leads', crewLeadRouter);
  app.use('/reports', reportsRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      res.status(400).json({ error: { message: 'Validation failed', details: err.issues } });
      return;
    }
    if (err instanceof HttpError) {
      res.status(err.statusCode).json({ error: { message: err.message } });
      return;
    }
    console.error(err);
    res.status(500).json({ error: { message: 'Internal Server Error' } });
  });

  return app;
};