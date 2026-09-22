import request from 'supertest';
import { createApp } from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Health Check Endpoint', () => {
  const app = createApp();

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /health', () => {
    it('should return healthy status with database connection', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.database).toBe('connected');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });

    it('should return correct timestamp', async () => {
      const response = await request(app).get('/health');
      const timestamp = new Date(response.body.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(Date.now() - 1000);
    });

    it('should return correct environment', async () => {
      const response = await request(app).get('/health');
      expect(response.body.environment).toBe(process.env.NODE_ENV || 'development');
    });

    it('should have correct structure', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('environment');
    });
  });
});