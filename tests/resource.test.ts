import request from 'supertest';
import { createApp } from '../src/app';
import { getOrCreateCrewLeadId } from './helpers';

const app = createApp();

describe('Resource CRUD', () => {
  let crewLeadId: string;

  beforeAll(async () => {
    crewLeadId = await getOrCreateCrewLeadId();
  });

  it('creates, lists, retrieves, updates, and decommissions a resource', async () => {
    const createRes = await request(app)
      .post('/resources')
      .set('x-crew-lead-id', crewLeadId)
      .send({ name: 'VIP Lounge', type: 'LOUNGE' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.status).toBe('ACTIVE');

    const id = createRes.body.id;

    const listRes = await request(app).get('/resources');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);

    const getRes = await request(app).get(`/resources/${id}`);
    expect(getRes.status).toBe(200);

    const updateRes = await request(app)
      .patch(`/resources/${id}`)
      .set('x-crew-lead-id', crewLeadId)
      .send({ minMembership: 'GOLD' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.minMembership).toBe('GOLD');

    const statusRes = await request(app)
      .patch(`/resources/${id}/status`)
      .set('x-crew-lead-id', crewLeadId)
      .send({ status: 'DECOMMISSIONED' });
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.status).toBe('DECOMMISSIONED');
  });

  it('returns 404 for an unknown resource', async () => {
    const res = await request(app).get('/resources/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('rejects resource creation without a crew lead', async () => {
    const res = await request(app).post('/resources').send({ name: 'No Auth Lounge', type: 'LOUNGE' });
    expect(res.status).toBe(401);
  });
});
