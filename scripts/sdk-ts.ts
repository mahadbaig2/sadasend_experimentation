import { SadaSend } from 'sadasend';

const mode = process.argv[2] ?? '--mock';
const email = { from: process.env.LAB_FROM || 'noreply@onboarding.sadasend.com', to: process.env.LAB_TEST_RECIPIENT || 'approved@example.com', subject: 'SDK integration lab', text: 'Synthetic SDK test', html: '<p>Synthetic SDK test</p>' };

if (mode === '--mock') {
  const calls: { url: string; method: string; idempotency: boolean; dryRun: boolean }[] = [];
  const fetchMock: typeof fetch = async (input, init) => {
    const body = JSON.parse(String(init?.body));
    const headers = new Headers(init?.headers);
    calls.push({ url: String(input), method: init?.method || '', idempotency: Boolean(headers.get('idempotency-key')), dryRun: body.dryRun === true });
    return Response.json({ id: 'mock-message', status: 'queued', dryRun: true });
  };
  const result = await new SadaSend('mock-key', { fetch: fetchMock, retry: { maxRetries: 0 } }).emails.send({ ...email, dryRun: true });
  if (!result.ok || calls.length !== 1 || !calls[0].dryRun || !calls[0].idempotency || !calls[0].url.endsWith('/emails')) process.exitCode = 1;
  console.log(JSON.stringify({ mode: 'mock', sdk: 'sadasend@0.1.6', result: result.ok ? { ok: true, status: result.status } : { ok: false, error: result.error.code }, calls }));
} else if (mode === '--dry-run') {
  if (!process.env.SADASEND_API_KEY || !process.env.LAB_TEST_RECIPIENT) throw new Error('SADASEND_API_KEY and LAB_TEST_RECIPIENT are required.');
  const result = await new SadaSend(process.env.SADASEND_API_KEY, { retry: { maxRetries: 0 }, timeoutMs: 12000 }).emails.send({ ...email, dryRun: true });
  console.log(JSON.stringify(result.ok ? { mode: 'live-dry-run', ok: true, id: result.id, status: result.status } : { mode: 'live-dry-run', ok: false, code: result.error.code, status: result.error.status, message: result.error.message }));
  if (!result.ok) process.exitCode = 1;
} else {
  throw new Error('Use --mock or --dry-run. This harness never dispatches live email.');
}
