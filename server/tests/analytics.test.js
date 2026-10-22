
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect
} from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../src/app.js';
import User from '../src/models/User.js';
import Ticket from '../src/models/Ticket.js';

let mongoServer;
let employee;
let agent;
let admin;

const JWT_SECRET =
  'resolveit-test-secret-key-at-least-32-characters-long';

function auth(user) {
  const token = jwt.sign(
    { sub: user._id.toString() },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  [employee, agent, admin] = await Promise.all([
    User.create({
      name: 'Analytics Employee',
      email: 'analytics-employee@test.com',
      password: 'TestPassword123',
      role: 'employee'
    }),
    User.create({
      name: 'Analytics Agent',
      email: 'analytics-agent@test.com',
      password: 'TestPassword123',
      role: 'agent'
    }),
    User.create({
      name: 'Analytics Admin',
      email: 'analytics-admin@test.com',
      password: 'TestPassword123',
      role: 'admin'
    })
  ]);
});

beforeEach(async () => {
  await Ticket.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('ResolveIT analytics API', () => {
  it('rejects requests without authentication', async () => {
    const response = await request(app)
      .get('/api/analytics/summary');

    expect(response.status).toBe(401);
  });

  it('prevents employees from accessing analytics', async () => {
    const response = await request(app)
      .get('/api/analytics/summary')
      .set(auth(employee));

    expect(response.status).toBe(403);
  });

  it('returns zero counts when there are no tickets', async () => {
    const response = await request(app)
      .get('/api/analytics/summary')
      .set(auth(agent));

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(0);
    expect(response.body.data.open).toBe(0);
    expect(response.body.data.inProgress).toBe(0);
    expect(response.body.data.resolved).toBe(0);
    expect(response.body.data.critical).toBe(0);
    expect(response.body.data.averageResolutionHours).toBeNull();
    expect(response.body.data.byStatus).toEqual([]);
    expect(response.body.data.byCategory).toEqual([]);
  });

  it('calculates ticket counts and category breakdowns', async () => {
    const now = Date.now();

    await Ticket.create([
      {
        title: 'Open laptop issue',
        description: 'An employee laptop is not working.',
        category: 'Hardware',
        priority: 'Medium',
        status: 'Open',
        createdBy: employee._id
      },
      {
        title: 'Active network issue',
        description: 'The office network connection is down.',
        category: 'Network',
        priority: 'Critical',
        status: 'In Progress',
        createdBy: employee._id
      },
      {
        title: 'Resolved software issue',
        description: 'An application error has been fixed.',
        category: 'Software',
        priority: 'High',
        status: 'Resolved',
        createdBy: employee._id,
        createdAt: new Date(now - 2 * 60 * 60 * 1000),
        resolvedAt: new Date(now)
      },
      {
        title: 'Closed critical issue',
        description: 'A critical hardware issue has been closed.',
        category: 'Hardware',
        priority: 'Critical',
        status: 'Closed',
        createdBy: employee._id
      }
    ]);

    const response = await request(app)
      .get('/api/analytics/summary')
      .set(auth(agent));

    expect(response.status).toBe(200);

    const data = response.body.data;

    expect(data.total).toBe(4);
    expect(data.open).toBe(1);
    expect(data.inProgress).toBe(1);
    expect(data.resolved).toBe(1);
    expect(data.critical).toBe(1);

    expect(data.averageResolutionHours).toBe(2);

    expect(data.byStatus).toEqual(
      expect.arrayContaining([
        { _id: 'Open', count: 1 },
        { _id: 'In Progress', count: 1 },
        { _id: 'Resolved', count: 1 },
        { _id: 'Closed', count: 1 }
      ])
    );

    expect(data.byCategory).toEqual(
      expect.arrayContaining([
        { _id: 'Hardware', count: 2 },
        { _id: 'Network', count: 1 },
        { _id: 'Software', count: 1 }
      ])
    );
  });

  it('allows administrators to access analytics', async () => {
    const response = await request(app)
      .get('/api/analytics/summary')
      .set(auth(admin));

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(0);
  });
});
