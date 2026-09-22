import request from 'supertest';
import { createApp } from '../src/app';
import { getOrCreateCrewLeadId } from './helpers';

const app = createApp();

describe('Passenger CRUD', () => {
  let crewLeadId: string;

  beforeAll(async () => {
    crewLeadId = await getOrCreateCrewLeadId();
  });

  it('creates, lists, retrieves, and updates membership for a passenger', async () => {
    const email = `passenger-${Date.now()}@test.com`;
    const createRes = await request(app)
      .post('/passengers')
      .set('x-crew-lead-id', crewLeadId)
      .send({ name: 'Ada Lovelace', email });
    expect(createRes.status).toBe(201);
    expect(createRes.body.membership).toBe('SILVER');

    const id = createRes.body.id;

    const listRes = await request(app).get('/passengers');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);

    const getRes = await request(app).get(`/passengers/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.email).toBe(email);

    const updateRes = await request(app)
      .patch(`/passengers/${id}/membership`)
      .set('x-crew-lead-id', crewLeadId)
      .send({ membership: 'GOLD' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.membership).toBe('GOLD');
  });

  it('returns 404 for an unknown passenger', async () => {
    const res = await request(app).get('/passengers/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('rejects passenger creation without a crew lead', async () => {
    const res = await request(app)
      .post('/passengers')
      .send({ name: 'No Auth', email: `no-auth-${Date.now()}@test.com` });
    expect(res.status).toBe(401);
  });

  it('rejects passenger creation with an unknown crew lead', async () => {
    const res = await request(app)
      .post('/passengers')
      .set('x-crew-lead-id', '00000000-0000-0000-0000-000000000000')
      .send({ name: 'Bad Auth', email: `bad-auth-${Date.now()}@test.com` });
    expect(res.status).toBe(401);
  });

  it('rejects duplicate passenger emails with a 409', async () => {
    const email = `dup-passenger-${Date.now()}@test.com`;
    const first = await request(app)
      .post('/passengers')
      .set('x-crew-lead-id', crewLeadId)
      .send({ name: 'First', email });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/passengers')
      .set('x-crew-lead-id', crewLeadId)
      .send({ name: 'Second', email });
    expect(second.status).toBe(409);
    expect(second.body.error.message).toMatch(/already exists/i);
  });

  it('rejects payloads with unknown fields', async () => {
    const res = await request(app)
      .post('/passengers')
      .set('x-crew-lead-id', crewLeadId)
      .send({ name: 'Extra Field', email: `extra-${Date.now()}@test.com`, unknownField: 'nope' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid membership values', async () => {
    const res = await request(app)
      .post('/passengers')
      .set('x-crew-lead-id', crewLeadId)
      .send({ name: 'Bad Membership', email: `bad-membership-${Date.now()}@test.com`, membership: 'BRONZE' });
    expect(res.status).toBe(400);
  });
});
