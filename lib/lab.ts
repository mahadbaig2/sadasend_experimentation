import { SadaSend } from 'sadasend';
import { mkdir, open } from 'node:fs/promises';
import { join } from 'node:path';

export type LabInput = { from: string; to: string; subject: string; text: string; html: string };

export function cleanInput(value: unknown): LabInput {
  if (!value || typeof value !== 'object') throw new Error('Email details are required.');
  const raw = value as Record<string, unknown>;
  const field = (name: string, max: number) => {
    const v = raw[name];
    if (typeof v !== 'string' || v.length > max) throw new Error(`Invalid ${name}.`);
    return v.trim();
  };
  const input = { from: field('from', 320), to: field('to', 320), subject: field('subject', 250), text: field('text', 20000), html: field('html', 30000) };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.to)) throw new Error('Enter one valid recipient address.');
  if (!/^[^<>\r\n]*<[^\s@]+@[^\s@]+\.[^\s@]+>$|^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.from)) throw new Error('Enter a sender address.');
  if (!input.subject || (!input.text && !input.html)) throw new Error('Subject and text or HTML content are required.');
  return input;
}

export function liveSendAllowed(to: string): boolean {
  const allowed = (process.env.LAB_APPROVED_RECIPIENTS ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return process.env.LAB_LIVE_SEND_ENABLED === '1' && Number(process.env.LAB_MAX_SENDS) > 0 && allowed.includes(to.toLowerCase());
}

export async function reserveSend(): Promise<number> {
  const max = Math.min(20, Math.floor(Number(process.env.LAB_MAX_SENDS) || 0));
  const dir = join(process.cwd(), '.lab');
  await mkdir(dir, { recursive: true });
  for (let n = 1; n <= max; n++) {
    try {
      const file = await open(join(dir, `send-${n}.reserved`), 'wx', 0o600);
      await file.close();
      return n;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
  }
  throw new Error('The configured live-send limit has been reached.');
}

export function client(): SadaSend {
  if (!process.env.SADASEND_API_KEY) throw new Error('SADASEND_API_KEY is not configured.');
  return new SadaSend(process.env.SADASEND_API_KEY, { retry: { maxRetries: 0 }, timeoutMs: 12000 });
}

export function publicResult(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const v = value as Record<string, unknown>;
  if (v.ok === false) {
    const e = v.error as { code?: string; message?: string; status?: number };
    return { ok: false, error: { code: e.code, message: e.message, status: e.status } };
  }
  return value;
}
