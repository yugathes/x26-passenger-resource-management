import request from 'supertest';
import { PrismaClient, MembershipLevel } from '@prisma/client';
import { createApp } from '../src/app';
import { getOrCreateCrewLeadId } from './helpers';

const prisma = new PrismaClient();
const app = createApp();

let crewLeadId: string;

const createPassenger = async (membership: MembershipLevel) => {
  const res = await request(app)
    .post('/passengers')
    .set('x-crew-lead-id', crewLeadId)
    .send({ name: 'Test Passenger', email: `${membership.toLowerCase()}-${Date.now()}-${Math.random()}@test.com`, membership });
  return res.body;
};

const createResource = async (minMembership: MembershipLevel) => {
  const res = await request(app)
    .post('/resources')
    .set('x-crew-lead-id', crewLeadId)
    .send({ name: 'Test Resource', type: 'LOUNGE', minMembership });
  return res.body;
};

describe('Resource access authorization', () => {
  beforeAll(async () => {
    await prisma.$connect();
    crewLeadId = await getOrCreateCrewLeadId();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('denies a Silver passenger access to a Gold resource', async () => {
    const passenger = await createPassenger('SILVER');
    const resource = await createResource('GOLD');

    const res = await request(app).post('/access').send({ passengerId: passenger.id, resourceId: resource.id });

    expect(res.status).toBe(403);
    expect(res.body.allowed).toBe(false);

    const audit = await prisma.auditLog.findFirst({
      where: { passengerId: passenger.id, resourceId: resource.id },
      orderBy: { createdAt: 'desc' }
    });
    expect(audit?.result).toBe('DENIED');
  });

  it('allows a Gold passenger to access Silver and Gold resources', async () => {
    const passenger = await createPassenger('GOLD');
    const silverResource = await createResource('SILVER');
    const goldResource = await createResource('GOLD');

    const silverRes = await request(app)
      .post('/access')
      .send({ passengerId: passenger.id, resourceId: silverResource.id });
    const goldRes = await request(app)
      .post('/access')
      .send({ passengerId: passenger.id, resourceId: goldResource.id });

    expect(silverRes.status).toBe(201);
    expect(silverRes.body.allowed).toBe(true);
    expect(goldRes.status).toBe(201);
    expect(goldRes.body.allowed).toBe(true);
  });

  it('allows a Platinum passenger to access all lower-tier resources', async () => {
    const passenger = await createPassenger('PLATINUM');
    const silverResource = await createResource('SILVER');
    const goldResource = await createResource('GOLD');
    const platinumResource = await createResource('PLATINUM');

    for (const resource of [silverResource, goldResource, platinumResource]) {
      const res = await request(app).post('/access').send({ passengerId: passenger.id, resourceId: resource.id });
      expect(res.status).toBe(201);
      expect(res.body.allowed).toBe(true);
    }
  });

  it('creates an audit log entry when access is denied', async () => {
    const passenger = await createPassenger('SILVER');
    const resource = await createResource('PLATINUM');

    await request(app).post('/access').send({ passengerId: passenger.id, resourceId: resource.id });

    const auditCount = await prisma.auditLog.count({
      where: { passengerId: passenger.id, resourceId: resource.id, result: 'DENIED' }
    });
    expect(auditCount).toBe(1);
  });

  it('creates a resource usage entry and an audit log entry on successful access', async () => {
    const passenger = await createPassenger('GOLD');
    const resource = await createResource('SILVER');

    const res = await request(app).post('/access').send({ passengerId: passenger.id, resourceId: resource.id });

    expect(res.status).toBe(201);

    const usageCount = await prisma.resourceUsage.count({
      where: { passengerId: passenger.id, resourceId: resource.id }
    });
    expect(usageCount).toBe(1);

    const auditCount = await prisma.auditLog.count({
      where: { passengerId: passenger.id, resourceId: resource.id, result: 'ALLOWED' }
    });
    expect(auditCount).toBe(1);
  });

  it('denies access when the resource is not active', async () => {
    const passenger = await createPassenger('PLATINUM');
    const resource = await createResource('SILVER');
    await prisma.resource.update({ where: { id: resource.id }, data: { status: 'INACTIVE' } });

    const res = await request(app).post('/access').send({ passengerId: passenger.id, resourceId: resource.id });

    expect(res.status).toBe(403);
    expect(res.body.allowed).toBe(false);
  });

  it('returns 404 when the passenger does not exist', async () => {
    const resource = await createResource('SILVER');
    const res = await request(app)
      .post('/access')
      .send({ passengerId: '00000000-0000-0000-0000-000000000000', resourceId: resource.id });
    expect(res.status).toBe(404);
  });
});
