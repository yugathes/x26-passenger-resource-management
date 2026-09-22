import request from 'supertest';
import { MembershipLevel } from '@prisma/client';
import { createApp } from '../src/app';
import { getOrCreateCrewLeadId } from './helpers';

const app = createApp();

let crewLeadId: string;

const createPassenger = async (membership: MembershipLevel) => {
  const res = await request(app)
    .post('/passengers')
    .set('x-crew-lead-id', crewLeadId)
    .send({ name: 'Report Passenger', email: `report-${membership}-${Date.now()}-${Math.random()}@test.com`, membership });
  return res.body;
};

const createResource = async (minMembership: MembershipLevel) => {
  const res = await request(app)
    .post('/resources')
    .set('x-crew-lead-id', crewLeadId)
    .send({ name: 'Report Resource', type: 'LOUNGE', minMembership });
  return res.body;
};

describe('Reporting and analytics', () => {
  beforeAll(async () => {
    crewLeadId = await getOrCreateCrewLeadId();
  });

  it('rejects report access without a crew lead', async () => {
    const res = await request(app).get('/reports/resources/usage');
    expect(res.status).toBe(401);
  });

  it('returns a passenger usage history', async () => {
    const passenger = await createPassenger('GOLD');
    const resource = await createResource('SILVER');

    await request(app).post('/access').send({ passengerId: passenger.id, resourceId: resource.id });

    const res = await request(app)
      .get(`/reports/passengers/${passenger.id}/usage`)
      .set('x-crew-lead-id', crewLeadId);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].resourceId).toBe(resource.id);
  });

  it('returns resource usage totals including the newly used resource', async () => {
    const passenger = await createPassenger('PLATINUM');
    const resource = await createResource('PLATINUM');

    await request(app).post('/access').send({ passengerId: passenger.id, resourceId: resource.id });

    const res = await request(app).get('/reports/resources/usage').set('x-crew-lead-id', crewLeadId);

    expect(res.status).toBe(200);
    const entry = res.body.find((item: { resourceId: string }) => item.resourceId === resource.id);
    expect(entry).toBeDefined();
    expect(entry.totalUsage).toBeGreaterThanOrEqual(1);
  });

  it('returns a resource demand summary with allowed and denied attempts', async () => {
    const silverPassenger = await createPassenger('SILVER');
    const goldResource = await createResource('GOLD');

    // Denied attempt: silver passenger cannot access a gold resource
    await request(app).post('/access').send({ passengerId: silverPassenger.id, resourceId: goldResource.id });

    const goldPassenger = await createPassenger('GOLD');
    // Allowed attempt on the same resource
    await request(app).post('/access').send({ passengerId: goldPassenger.id, resourceId: goldResource.id });

    const res = await request(app).get('/reports/resources/demand').set('x-crew-lead-id', crewLeadId);

    expect(res.status).toBe(200);
    const entry = res.body.find((item: { resourceId: string }) => item.resourceId === goldResource.id);
    expect(entry).toBeDefined();
    expect(entry.allowed).toBeGreaterThanOrEqual(1);
    expect(entry.denied).toBeGreaterThanOrEqual(1);
    expect(entry.totalAttempts).toBe(entry.allowed + entry.denied);
  });

  it('returns usage summarized by membership level', async () => {
    const res = await request(app).get('/reports/membership-usage').set('x-crew-lead-id', crewLeadId);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('SILVER');
    expect(res.body).toHaveProperty('GOLD');
    expect(res.body).toHaveProperty('PLATINUM');
  });
});
