import { NextRequest, NextResponse } from 'next/server';
import { cleanInput, client, liveSendAllowed, publicResult, reserveSend } from '@/lib/lab';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.SADASEND_API_KEY), liveSendEnabled: process.env.LAB_LIVE_SEND_ENABLED === '1', approvedRecipientsConfigured: Boolean(process.env.LAB_APPROVED_RECIPIENTS), sender: process.env.LAB_FROM || 'noreply@onboarding.sadasend.com' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = body.action;
    if (action === 'preview') {
      const email = cleanInput(body.email);
      return NextResponse.json({ ok: true, status: 'local_preview', email, note: 'Rendered locally. No SadaSend request was made.' });
    }
    if (action === 'lookup') {
      const id = body.id;
      if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(id)) throw new Error('Enter a valid message ID.');
      return NextResponse.json(publicResult(await client().emails.get(id)));
    }
    if (action === 'dry_run' || action === 'send') {
      const email = cleanInput(body.email);
      if (action === 'send') {
        if (!liveSendAllowed(email.to)) return NextResponse.json({ ok: false, error: { message: 'Live sending is disabled or this recipient is not approved.' } }, { status: 403 });
        if (!process.env.SADASEND_API_KEY) throw new Error('SADASEND_API_KEY is not configured.');
        await reserveSend();
      }
      const result = await client().emails.send({ ...email, dryRun: action === 'dry_run', idempotencyKey: crypto.randomUUID() });
      return NextResponse.json(publicResult(result));
    }
    throw new Error('Unknown action.');
  } catch (error) {
    return NextResponse.json({ ok: false, error: { message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 400 });
  }
}
