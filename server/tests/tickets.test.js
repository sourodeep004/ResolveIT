import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
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
import Comment from '../src/models/Comment.js';
import AuditLog from '../src/models/AuditLog.js';

const JWT_SECRET =
  'resolveit-test-secret-key-at-least-32-characters-long';

let mongoServer;
let employee;
let anotherEmployee;
let agent;
let anotherAgent;
let admin;
let ticket;

function tokenFor(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function auth(user) {
  return {
    Authorization: `Bearer ${tokenFor(user)}`
  };
}

async function createTicket(overrides = {}) {
  return Ticket.create({
    title: 'Laptop not working',
    description: 'The laptop does not start after charging.',
    category: 'Hardware',
    priority: 'Medium',
    createdBy: employee._id,
    ...overrides
  });
}

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;

  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());

  [employee, anotherEmployee, agent, anotherAgent, admin] =
    await Promise.all([
      User.create({
        name: 'Employee One',
        email: 'employee1@test.com',
        password: 'TestPassword123',
        role: 'employee'
      }),
      User.create({
        name: 'Employee Two',
        email: 'employee2@test.com',
        password: 'TestPassword123',
        role: 'employee'
      }),
      User.create({
        name: 'Agent One',
        email: 'agent1@test.com',
        password: 'TestPassword123',
        role: 'agent'
      }),
      User.create({
        name: 'Agent Two',
        email: 'agent2@test.com',
        password: 'TestPassword123',
        role: 'agent'
      }),
      User.create({
        name: 'Admin One',
        email: 'admin@test.com',
        password: 'TestPassword123',
        role: 'admin'
      })
    ]);
}, 60000);

beforeEach(async () => {
  await Promise.all([
    Ticket.deleteMany({}),
    Comment.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  ticket = await createTicket({
    assignedTo: agent._id
  });
});

afterEach(async () => {
  // Each test starts with a freshly created ticket.
  // User records are intentionally retained between tests.
});

afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } finally {
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
});

describe('ResolveIT ticket API security', () => {
  describe('Authentication', () => {
    it('rejects requests without a JWT', async () => {
      const response = await request(app).get('/api/tickets');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'Authentication required.'
      );
    });

    it('rejects an invalid JWT', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', 'Bearer invalid.token.value');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        'Invalid or expired token.'
      );
    });

    it('rejects an expired JWT', async () => {
      const expiredToken = jwt.sign(
        { sub: employee._id.toString() },
        JWT_SECRET,
        { expiresIn: -1 }
      );

      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Ticket visibility and ownership', () => {
    it('allows an employee to view their own ticket', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set(auth(employee));

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(
        ticket._id.toString()
      );
    });

    it('prevents an employee from viewing another employee ticket', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set(auth(anotherEmployee));

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'You cannot view this ticket.'
      );
    });

    it('allows the assigned agent to view a ticket', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set(auth(agent));

      expect(response.status).toBe(200);
    });

    it('prevents an unassigned agent from viewing a ticket', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set(auth(anotherAgent));

      expect(response.status).toBe(403);
    });

    it('allows an administrator to view any ticket', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set(auth(admin));

      expect(response.status).toBe(200);
    });

    it('returns 404 for a ticket that does not exist', async () => {
      const nonexistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/tickets/${nonexistentId}`)
        .set(auth(employee));

      expect(response.status).toBe(404);
    });
  });

  describe('Role-based ticket updates', () => {
    it('prevents employees from changing ticket status', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set(auth(employee))
        .send({ status: 'In Progress' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'Employees can only edit their ticket details.'
      );
    });

    it('prevents employees from assigning tickets', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set(auth(employee))
        .send({
          assignedTo: anotherAgent._id.toString()
        });

      expect(response.status).toBe(403);
    });

    it('prevents employees from updating another employee ticket', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set(auth(anotherEmployee))
        .send({ title: 'Unauthorized title change' });

      expect(response.status).toBe(403);
    });

    it('prevents an agent from updating a ticket assigned to another agent', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set(auth(anotherAgent))
        .send({ status: 'In Progress' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'You can only update tickets assigned to you.'
      );
    });

    it('allows the assigned agent to move a ticket to In Progress', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set(auth(agent))
        .send({ status: 'In Progress' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('In Progress');
    });

    it('prevents an agent from changing ticket assignment', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set(auth(agent))
        .send({
          assignedTo: anotherAgent._id.toString()
        });

      expect(response.status).toBe(403);
    });

    it('rejects an invalid ticket status transition', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set(auth(agent))
        .send({ status: 'Closed' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'Invalid status transition'
      );
    });

    it('rejects assignment to a user who is not an agent or administrator', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set(auth(admin))
        .send({
          assignedTo: anotherEmployee._id.toString()
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'Tickets can only be assigned to an agent or administrator.'
      );
    });
  });

  describe('Ticket creation and validation', () => {
    it('allows an employee to create a valid ticket', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set(auth(employee))
        .send({
          title: 'Cannot access email',
          description: 'The email application fails to load.',
          category: 'Software',
          priority: 'High'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe(
        'Cannot access email'
      );
      expect(response.body.data.priority).toBe('High');
    });

    it('sets a four-hour SLA deadline for a Critical ticket', async () => {
      const before = Date.now();

      const response = await request(app)
        .post('/api/tickets')
        .set(auth(employee))
        .send({
          title: 'Critical server failure',
          description: 'The production server is unavailable.',
          category: 'Software',
          priority: 'Critical'
        });

      const after = Date.now();

      expect(response.status).toBe(201);

      const dueAt = new Date(
        response.body.data.dueAt
      ).getTime();

      const fourHours = 4 * 60 * 60 * 1000;

      expect(Number.isNaN(dueAt)).toBe(false);
      expect(dueAt).toBeGreaterThanOrEqual(
        before + fourHours
      );
      expect(dueAt).toBeLessThanOrEqual(
        after + fourHours
      );
    });

    it('rejects tickets with invalid input', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set(auth(employee))
        .send({
          title: 'Bad',
          description: 'Short'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid input.');
    });

    it('rejects ticket creation without authentication', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .send({
          title: 'Cannot access email',
          description: 'The email application fails to load.',
          category: 'Software',
          priority: 'High'
        });

      expect(response.status).toBe(401);
    });
  });
});


describe('ResolveIT API regression coverage', () => {
  describe('Ticket listing and pagination', () => {
    it('returns pagination metadata for an employee', async () => {
      const response = await request(app)
        .get('/api/tickets?page=1&limit=10')
        .set(auth(employee));

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1,
      });
    });

    it('filters tickets by priority', async () => {
      await createTicket({
        title: 'Network connectivity issue',
        description: 'The office network is unavailable.',
        priority: 'High',
      });

      const response = await request(app)
        .get('/api/tickets?priority=High')
        .set(auth(employee));

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].priority).toBe('High');
    });

    it('rejects invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/tickets?page=0&limit=500')
        .set(auth(employee));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid input.');
    });

    it('rejects malformed ticket IDs', async () => {
      const response = await request(app)
        .get('/api/tickets/not-a-valid-id')
        .set(auth(employee));

      expect(response.status).toBe(400);
    });
  });

  describe('Comments and audit history', () => {
    it('allows an authorized employee to comment on their ticket', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/comments`)
        .set(auth(employee))
        .send({ body: 'I have restarted the laptop.' });

      expect(response.status).toBe(201);
      expect(response.body.data.body).toBe(
        'I have restarted the laptop.'
      );
    });

    it('prevents another employee from commenting on the ticket', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/comments`)
        .set(auth(anotherEmployee))
        .send({ body: 'Unauthorized comment' });

      expect(response.status).toBe(403);
    });

    it('rejects empty comments', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/comments`)
        .set(auth(employee))
        .send({ body: '   ' });

      expect(response.status).toBe(400);
    });

    it('returns comments and audit history with ticket details', async () => {
      await request(app)
        .post(`/api/tickets/${ticket._id}/comments`)
        .set(auth(employee))
        .send({ body: 'Please investigate this issue.' });

      const response = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set(auth(employee));

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(1);
      expect(response.body.comments[0].body).toBe(
        'Please investigate this issue.'
      );
      expect(response.body.history.length).toBeGreaterThan(0);
    });
  });

  describe('SLA and workflow regression', () => {
    it('reports a ticket as within SLA before its deadline', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set(auth(employee));

      expect(response.status).toBe(200);
      expect(response.body.data.slaStatus).toBe('Within SLA');
    });

    it('reports an overdue ticket correctly', async () => {
      ticket.dueAt = new Date(Date.now() - 60_000);
      await ticket.save();

      const response = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set(auth(employee));

      expect(response.status).toBe(200);
      expect(response.body.data.slaStatus).toBe('Overdue');
    });

    it('records an audit entry when an agent changes status', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set(auth(agent))
        .send({ status: 'In Progress' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('In Progress');

      const details = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set(auth(employee));

      expect(details.status).toBe(200);
      expect(
        details.body.history.some(
          (entry) => entry.action === 'Status changed'
        )
      ).toBe(true);
    });
  });
});

describe('ResolveIT ticket workflow edge cases', () => {
  it('rejects an invalid status transition', async () => {
    const response = await request(app)
      .patch(`/api/tickets/${ticket._id}`)
      .set(auth(agent))
      .send({ status: 'Closed' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      'Invalid status transition'
    );
  });

  it('rejects updates from an agent not assigned to the ticket', async () => {
    const response = await request(app)
      .patch(`/api/tickets/${ticket._id}`)
      .set(auth(anotherAgent))
      .send({ status: 'In Progress' });

    expect(response.status).toBe(403);
    expect(response.body.message).toContain(
      'assigned to you'
    );
  });

  it('rejects an empty ticket update', async () => {
    const response = await request(app)
      .patch(`/api/tickets/${ticket._id}`)
      .set(auth(admin))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Provide at least one field to update.'
    );
  });

  it('rejects assigning a ticket to an employee', async () => {
    const response = await request(app)
      .patch(`/api/tickets/${ticket._id}`)
      .set(auth(admin))
      .send({ assignedTo: employee._id.toString() });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      'agent or administrator'
    );
  });

  it('recalculates the SLA deadline when priority changes', async () => {
    const previousDeadline = new Date(ticket.dueAt).getTime();

    const response = await request(app)
      .patch(`/api/tickets/${ticket._id}`)
      .set(auth(agent))
      .send({ priority: 'Critical' });

    expect(response.status).toBe(200);

    const updatedDeadline = new Date(
      response.body.data.dueAt
    ).getTime();

    expect(updatedDeadline).toBeGreaterThan(Date.now());
    expect(updatedDeadline - Date.now()).toBeLessThanOrEqual(
      4 * 60 * 60 * 1000
    );
    expect(updatedDeadline).not.toBe(previousDeadline);

    const auditEntries = await AuditLog.find({
      ticket: ticket._id
    });

    expect(
      auditEntries.some(
        (entry) => entry.action === 'SLA deadline updated'
      )
    ).toBe(true);
  });
});
