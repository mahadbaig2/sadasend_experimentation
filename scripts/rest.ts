/** Read-only and dry-run REST probe. Never sends a real message. */
export {};
const [mode, argument] = process.argv.slice(2);
const baseUrl = (process.env.SADASEND_BASE_URL || 'https://api.sadasend.com').replace(/\/+$/, '');
const key = process.env.SADASEND_API_KEY;
if (!['--account', '--dry-run', '--lookup', '--invalid-auth'].includes(mode || '')) throw new Error('Use --account, --dry-run, --lookup ID, or --invalid-auth. This probe never dispatches email.');
if (mode !== '--invalid-auth' && !key) throw new Error('Set SADASEND_API_KEY server-side.');

let path = '/account';
let method = 'GET';
let body: string | undefined;
if (mode === '--lookup') {
  if (!argument || !/^[a-zA-Z0-9_-]{1,120}$/.test(argument)) throw new Error('Provide a valid message ID.');
  path = `/emails/${encodeURIComponent(argument)}`;
}
if (mode === '--dry-run') {
  const to = process.env.LAB_TEST_RECIPIENT;
  if (!to) throw new Error('Set LAB_TEST_RECIPIENT to the approved address.');
  path = '/emails'; method = 'POST';
  body = JSON.stringify({ from: process.env.LAB_FROM || 'noreply@onboarding.sadasend.com', to: [to], subject: 'REST integration lab dry run', text: 'Synthetic non-sending check', dryRun: true });
}
const response = await fetch(`${baseUrl}${path}`, { method, headers: { authorization: `Bearer ${mode === '--invalid-auth' ? 'invalid-fixture-key' : key}`, ...(body ? { 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() } : {}) }, body, signal: AbortSignal.timeout(12000) });
const raw = await response.text();
let data: Record<string, unknown> = {};
try { data = JSON.parse(raw); } catch { data = { nonJson: true }; }
const error = data.error && typeof data.error === 'object' ? data.error as Record<string, unknown> : {};
console.log(JSON.stringify({ mode, httpStatus: response.status, requestId: response.headers.get('x-request-id') ?? response.headers.get('request-id'), response: response.ok ? { id: data.id, status: data.status, dryRun: data.dryRun } : { code: error.code ?? data.code, message: error.message ?? data.message, retryAfter: response.headers.get('retry-after') } }));
if (mode === '--invalid-auth' ? response.status !== 401 : !response.ok) process.exitCode = 1;
