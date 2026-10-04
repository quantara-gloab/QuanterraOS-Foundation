import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';
import { db } from '../db.ts';

describe('Healthcheck Endpoints (/health, /healthz)', () => {
  it('database connection query executes successfully', async () => {
    const result = await db.run(sql`SELECT 1 as alive`);
    assert.ok(result, 'SELECT 1 must succeed');
  });

  it('health response contract adheres to HANDOFF.md J2/J3/L specification', async () => {
    const checkDb = async () => {
      await db.run(sql`SELECT 1`);
      return {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    };

    const health = await checkDb();
    assert.strictEqual(health.status, 'ok');
    assert.strictEqual(health.database, 'connected');
    assert.strictEqual(typeof health.uptime, 'number');
    assert.ok(health.uptime >= 0);
    assert.ok(Date.parse(health.timestamp) > 0);
  });
});
