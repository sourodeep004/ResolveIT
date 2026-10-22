
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
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../src/app.js';
import User from '../src/models/User.js';

let mongoServer;

const JWT_SECRET =
  'resolveit-test-secret-key-at-least-32-characters-long';

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('ResolveIT authentication API', () => {
  it('registers a new user as an employee', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Employee',
        email: 'employee@example.com',
        password: 'SecurePass123',
        department: 'IT'
      });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBe('employee@example.com');
    expect(response.body.user.role).toBe('employee');

    // Never expose the password in the response.
    expect(response.body.user.password).toBeUndefined();
  });

  it('does not allow public registration to grant admin privileges', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Administrator',
        email: 'newadmin@example.com',
        password: 'SecurePass123',
        role: 'admin'
      });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('employee');
  });

  it('rejects duplicate email registration', async () => {
    const user = {
      name: 'Test Employee',
      email: 'duplicate@example.com',
      password: 'SecurePass123'
    };

    await request(app).post('/api/auth/register').send(user);

    const response = await request(app)
      .post('/api/auth/register')
      .send(user);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe(
      'An account with this email already exists.'
    );
  });

  it('rejects registration with an invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Employee',
        email: 'not-an-email',
        password: 'SecurePass123'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid input.');
  });

  it('rejects registration with a short password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Employee',
        email: 'shortpass@example.com',
        password: '123'
      });

    expect(response.status).toBe(400);
  });

  it('logs in with valid credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login Employee',
        email: 'login@example.com',
        password: 'SecurePass123'
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'SecurePass123'
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBe('login@example.com');
  });

  it('rejects login with an incorrect password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login Employee',
        email: 'login@example.com',
        password: 'SecurePass123'
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'WrongPassword123'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      'Email or password is incorrect.'
    );
  });

  it('rejects login for a nonexistent account', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'missing@example.com',
        password: 'SecurePass123'
      });

    expect(response.status).toBe(401);
  });

  it('rejects login with missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com' });

    expect(response.status).toBe(400);
  });

  it('returns the current user from a valid token', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Profile Employee',
        email: 'profile@example.com',
        password: 'SecurePass123'
      });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('profile@example.com');
    expect(response.body.user.role).toBe('employee');
  });

  it('rejects the current-user endpoint without a token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
  });
});
