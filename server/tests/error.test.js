
import { describe, it, expect, vi, afterEach } from 'vitest';
import { notFound, errorHandler } from '../src/middleware/errors.js';

function createResponse() {
  const res = {
    statusCode: 200,
    body: null,
    status: vi.fn(function (code) {
      this.statusCode = code;
      return this;
    }),
    json: vi.fn(function (body) {
      this.body = body;
      return this;
    }),
    headersSent: false
  };

  return res;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ResolveIT error middleware', () => {
  it('returns 404 for an unknown route', () => {
    const req = {
      method: 'GET',
      originalUrl: '/api/unknown'
    };
    const res = createResponse();

    notFound(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Route not found: GET /api/unknown'
    });
  });

  it('returns 409 for a duplicate database record', () => {
    const res = createResponse();
    const err = { code: 11000 };

    errorHandler(err, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'A record with that value already exists.'
    });
  });

  it('returns 400 for a Mongoose validation error', () => {
    const res = createResponse();
    const err = {
      name: 'ValidationError',
      message: 'Title is required'
    };

    errorHandler(err, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Title is required'
    });
  });

  it('returns the supplied status and message for a known HTTP error', () => {
    const res = createResponse();
    const err = {
      status: 403,
      message: 'Access denied'
    };

    errorHandler(err, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Access denied'
    });
  });

  it('hides internal details for an unexpected server error', () => {
    const res = createResponse();
    const next = vi.fn();
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(new Error('Database connection secret'), {}, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Internal server error.'
    });
    expect(logSpy).toHaveBeenCalled();
  });

  it('passes the error to next when headers have already been sent', () => {
    const res = createResponse();
    res.headersSent = true;
    const err = new Error('Response already started');
    const next = vi.fn();

    errorHandler(err, {}, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
