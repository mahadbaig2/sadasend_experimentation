import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { cleanInput, liveSendAllowed } from '../lib/lab';
import { verifyWebhook } from 'sadasend/webhooks';

const email = { from: 'Sender <sender@example.com>', to: 'approved@example.com', subject: 'Synthetic', text: 'Hello', html: '' };

test('local email validation requires content and one valid recipient', () => {
  assert.deepEqual(cleanInput(email), email);
  assert.throws(() => cleanInput({ ...email, to: 'two@example.com,three@example.com' }), /recipient/);
  assert.throws(() => cleanInput({ ...email, text: '' }), /content/);
});

test('live send requires explicit flag, exact recipient and positive limit', () => {
  const previous = { enabled: process.env.LAB_LIVE_SEND_ENABLED, recipients: process.env.LAB_APPROVED_RECIPIENTS, max: process.env.LAB_MAX_SENDS };
  try {
    process.env.LAB_APPROVED_RECIPIENTS = 'approved@example.com';
    process.env.LAB_MAX_SENDS = '2';
    process.env.LAB_LIVE_SEND_ENABLED = '0';
    assert.equal(liveSendAllowed(email.to), false);
    process.env.LAB_LIVE_SEND_ENABLED = '1';
    assert.equal(liveSendAllowed(email.to), true);
    assert.equal(liveSendAllowed('other@example.com'), false);
  } finally {
    for (const [name, value] of Object.entries({ LAB_LIVE_SEND_ENABLED: previous.enabled, LAB_APPROVED_RECIPIENTS: previous.recipients, LAB_MAX_SENDS: previous.max })) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});

test('official webhook verifier validates timestamped raw payload', async () => {
  const secret = 'synthetic-fixture-secret';
  const body = '{"id":"fixture"}';
  const now = 1_800_000_000_000;
  const seconds = Math.floor(now / 1000);
  const sign = (time: number) => `t=${time},v1=${createHmac('sha256', secret).update(`${time}.${body}`).digest('hex')}`;
  assert.equal(await verifyWebhook(secret, body, sign(seconds), { atMs: now }), true);
  assert.equal(await verifyWebhook(secret, body, sign(seconds - 600), { atMs: now }), false);
  assert.equal(await verifyWebhook(secret, body + ' ', sign(seconds), { atMs: now }), false);
});
