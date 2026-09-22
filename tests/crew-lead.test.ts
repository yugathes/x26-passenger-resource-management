import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';
import { MAX_CREW_LEADS } from '../src/modules/crew-leads/crew-lead.service';

const prisma = new PrismaClient();
const app = createApp();

describe('Crew lead management', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates, lists, and retrieves crew leads', async () => {
    const count = await prisma.crewLead.count();
    if (count >= MAX_CREW_LEADS) {
      return;
    }

    const email = `crew-lead-${Date.now()}@test.com`;
    const createRes = await request(app)
      .post('/crew-leads')
      .send({ name: 'Operations Lead', email, role: 'OPERATIONS' });
    expect(createRes.status).toBe(201);

    const listRes = await request(app).get('/crew-leads');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);

    const getRes = await request(app).get(`/crew-leads/${createRes.body.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.email).toBe(email);
  });

  it('enforces a maximum of 3 crew leads and rejects a 4th', async () => {
    const existing = await prisma.crewLead.count();
    const remainingSlots = Math.max(0, MAX_CREW_LEADS - existing);

    for (let i = 0; i < remainingSlots; i++) {
      const res = await request(app)
        .post('/crew-leads')
        .send({ name: `Crew Lead ${i}`, email: `crew-slot-${Date.now()}-${i}@test.com`, role: 'OPERATIONS' });
      expect(res.status).toBe(201);
    }

    expect(await prisma.crewLead.count()).toBe(MAX_CREW_LEADS);

    const rejected = await request(app)
      .post('/crew-leads')
      .send({ name: 'Extra Crew Lead', email: `extra-crew-${Date.now()}@test.com`, role: 'OPERATIONS' });

    expect(rejected.status).toBe(409);
  });

  it('returns 404 for an unknown crew lead', async () => {
    const res = await request(app).get('/crew-leads/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('rejects duplicate crew lead emails with a 409', async () => {
    const count = await prisma.crewLead.count();
    if (count >= MAX_CREW_LEADS) {
      return;
    }

    const email = `dup-crew-lead-${Date.now()}@test.com`;
    const first = await request(app).post('/crew-leads').send({ name: 'First', email, role: 'OPERATIONS' });
    expect(first.status).toBe(201);

    const second = await request(app).post('/crew-leads').send({ name: 'Second', email, role: 'OPERATIONS' });
    expect(second.status).toBe(409);
    expect(second.body.error.message).toMatch(/already exists/i);
  });

  it('rejects payloads with unknown fields', async () => {
    const res = await request(app)
      .post('/crew-leads')
      .send({ name: 'Extra Field', email: `extra-crew-${Date.now()}@test.com`, role: 'OPERATIONS', unknownField: 'nope' });
    expect(res.status).toBe(400);
  });
});
