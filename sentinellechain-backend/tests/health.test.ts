import request from 'supertest';
import { app } from '../src/server'; // Adjust path as necessary
import http from 'http';

let server: http.Server;

beforeAll((done) => {
  server = http.createServer(app);
  server.listen(done); // Use a random available port
});

afterAll((done) => {
  server.close(done);
});

describe('GET /health', () => {
  it('should return 200 OK and status UP', async () => {
    const res = await request(server).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ status: 'UP' });
  });
});
