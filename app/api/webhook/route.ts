import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from 'sadasend/webhooks';
import { mkdir, open } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const secret = process.env.SADASEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook secret is not configured.' }, { status: 503 });
  const signature = request.headers.get('sadasend-signature') ?? '';
  const payload = await request.text();
  const valid = await verifyWebhook(secret, payload, signature);
  if (!valid) return NextResponse.json({ error: 'Invalid or expired signature.' }, { status: 401 });
  const digest = createHash('sha256').update(signature).update(payload).digest('hex');
  const dir = join(process.cwd(), '.lab', 'webhook-events');
  await mkdir(dir, { recursive: true });
  try {
    const file = await open(join(dir, digest), 'wx', 0o600);
    await file.close();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') return NextResponse.json({ accepted: true, duplicate: true });
    throw error;
  }
  return NextResponse.json({ accepted: true, duplicate: false });
}
