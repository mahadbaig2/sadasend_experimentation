'use client';

import { useEffect, useState } from 'react';

type Email = { from: string; to: string; subject: string; text: string; html: string };
type ResponseData = { ok?: boolean; status?: string; id?: string; dryRun?: boolean; error?: { code?: string; message?: string; status?: number }; note?: string; data?: Record<string, unknown>; email?: Email };

const starter: Email = { from: '', to: '', subject: 'Your verification code', text: 'Your verification code is 123456. It expires in 10 minutes.', html: '<h1>Your verification code</h1><p>Your code is <strong>123456</strong>.</p>' };

export default function Page() {
  const [email, setEmail] = useState<Email>(starter);
  const [connection, setConnection] = useState<{ configured: boolean; liveSendEnabled: boolean; approvedRecipientsConfigured: boolean; sender: string } | null>(null);
  const [result, setResult] = useState<ResponseData | null>(null);
  const [activity, setActivity] = useState<{ step: string; state: string; detail: string }[]>([]);
  const [pending, setPending] = useState('');
  const [messageId, setMessageId] = useState('');
  const [tab, setTab] = useState<'compose' | 'status' | 'agent' | 'results'>('compose');

  useEffect(() => { fetch('/api/lab').then(r => r.json()).then(c => { setConnection(c); setEmail(v => ({ ...v, from: c.sender })); }).catch(() => {}); }, []);

  async function run(action: 'preview' | 'dry_run' | 'send' | 'lookup') {
    setPending(action); setResult(null);
    try {
      const response = await fetch('/api/lab', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(action === 'lookup' ? { action, id: messageId } : { action, email }) });
      const data = await response.json() as ResponseData;
      setResult(data);
      if (data.id) setMessageId(data.id);
      if (data.status === 'local_preview') setTab('compose');
      setActivity(v => [{ step: action.replace('_', ' '), state: data.ok ? 'passed' : 'failed', detail: data.ok ? data.status ?? 'Request accepted' : data.error?.message ?? `HTTP ${response.status}` }, ...v].slice(0, 10));
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Request failed';
      setResult({ ok: false, error: { message: detail } });
      setActivity(v => [{ step: action, state: 'failed', detail }, ...v].slice(0, 10));
    } finally { setPending(''); }
  }

  const configured = connection?.configured === true;
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brandmark">✳</span><div><strong>Integration Lab</strong><small>SadaSend evaluation</small></div></div>
      <div className="side-label">WORKSPACE</div>
      <nav>
        {([['compose', '✉', 'Compose & preview'], ['status', '◷', 'Message status'], ['agent', '⌘', 'Agent / MCP'], ['results', '▦', 'Capability results']] as const).map(([key, icon, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}><span>{icon}</span>{label}</button>)}
      </nav>
      <div className="sidebar-bottom"><span className="dot" /> Local evaluation workspace<br/><small>No sends without explicit local enablement</small></div>
    </aside>
    <main>
      <header><div className="eyebrow">DEVELOPER EXPERIENCE / EMAIL</div><div className="topright"><span className="version">SDK 0.1.6</span><span className={`pill ${configured ? 'ready' : 'blocked'}`}>{configured ? '● Key configured' : '○ Not configured'}</span></div></header>
      <div className="content">
        <div className="intro"><div><p className="kicker">SADASEND EVALUATION</p><h1>{tab === 'compose' ? 'Compose & preview' : tab === 'status' ? 'Message status' : tab === 'agent' ? 'Agent & MCP testing' : 'Capability results'}</h1><p className="muted">A focused workspace for testing what works, recording friction, and separating local checks from live behavior.</p></div><span className="phase">01 / EXPLORE</span></div>
        <div className="status-grid"><div className="status-card"><span>API CONNECTION</span><strong>{configured ? 'Ready to test' : 'Not configured'}</strong><small>{configured ? 'Server-side key is present' : 'Add SADASEND_API_KEY in .env.local'}</small></div><div className="status-card"><span>LIVE SEND</span><strong>{connection?.liveSendEnabled ? 'Enabled locally' : 'Safely disabled'}</strong><small>Recipient allowlist and send limit required</small></div><div className="status-card"><span>HOSTED MCP</span><strong>Send verified</strong><small>Approved test reported in Inbox</small></div></div>

        {tab === 'compose' && <div className="two-col"><section className="panel"><div className="panel-heading"><div><span className="section-number">01</span><h2>Transactional message</h2></div><span className="subtle">Synthetic content only</span></div><div className="fields"><label>From<input value={email.from} onChange={e => setEmail({ ...email, from: e.target.value })} placeholder="sender@verified-domain.com" /></label><label>To<input value={email.to} onChange={e => setEmail({ ...email, to: e.target.value })} placeholder="approved@example.com" /></label><label>Subject<input value={email.subject} onChange={e => setEmail({ ...email, subject: e.target.value })} /></label><label>Plain text<textarea rows={4} value={email.text} onChange={e => setEmail({ ...email, text: e.target.value })} /></label><label>HTML<textarea className="code" rows={5} value={email.html} onChange={e => setEmail({ ...email, html: e.target.value })} /></label></div><div className="actions"><button className="primary" disabled={Boolean(pending)} onClick={() => run('preview')}>Preview locally <span>→</span></button><button disabled={Boolean(pending) || !configured} onClick={() => run('dry_run')}>SadaSend dry run</button><button disabled={Boolean(pending) || !configured || !connection?.liveSendEnabled} onClick={() => run('send')}>Send approved test</button></div><p className="hint">Local preview makes no network request. A dry run calls SadaSend and needs a key. Live sending needs explicit allowlist and limit settings.</p></section><section className="panel preview"><div className="panel-heading"><div><span className="section-number">02</span><h2>Preview</h2></div><span className="pill neutral">LOCAL ONLY</span></div><div className="mail"><div className="mail-meta"><span>From</span><b>{email.from || '—'}</b><span>To</span><b>{email.to || '—'}</b><span>Subject</span><b>{email.subject || '—'}</b></div><div className="mail-body"><h3>{email.subject || 'Subject'}</h3><p>{email.text || 'Your message preview will appear here.'}</p></div></div><p className="hint">Plain-text preview. HTML source is preserved for the API request but is not rendered in this panel.</p></section></div>}

        {tab === 'status' && <div className="two-col"><section className="panel"><div className="panel-heading"><div><span className="section-number">03</span><h2>Look up a message</h2></div></div><p className="muted">Fetch the current API record by ID. “Queued” or “pending approval” does not prove inbox placement.</p><label>Message ID<input value={messageId} onChange={e => setMessageId(e.target.value)} placeholder="Message ID from a test send" /></label><div className="actions"><button className="primary" disabled={!configured || Boolean(pending)} onClick={() => run('lookup')}>Fetch status →</button></div></section><section className="panel"><div className="panel-heading"><h2>Event interpretation</h2></div><div className="timeline">{['Request accepted', 'Queued or pending approval', 'Sent by provider', 'Accepted by recipient server', 'Inbox placement: separate evidence'].map((x, i) => <div key={x}><i>{i + 1}</i><span>{x}</span></div>)}</div></section></div>}

        {tab === 'agent' && <div className="two-col"><section className="panel"><div className="panel-heading"><h2>Hosted MCP probe</h2><span className="pill ready">PASSED</span></div><p className="muted">The official MCP client initialized over streamable HTTP and discovered 11 tools with this key. Preview passed. One approval-mode send was reported in the Inbox by the user.</p><pre>NODE_OPTIONS=--use-env-proxy npm run lab:mcp -- --discover</pre><p className="hint">Current official endpoint: https://mcp.sadasend.com. The returned held message ID was not resolvable through MCP status or search.</p></section><section className="panel"><div className="panel-heading"><h2>Bounded agent task</h2></div><p>Inspect this repository, integrate SadaSend in sandbox mode, preview a transactional email, identify configuration problems, and verify the outcome.</p><p className="hint">Codex is available locally. Claude Code CLI is not installed. No paid model run has been performed.</p></section></div>}

        {tab === 'results' && <div className="panel"><div className="panel-heading"><h2>Evidence ledger</h2><span className="subtle">Updated during evaluation</span></div><div className="result-list"><div><b>Local preview</b><span className="pill ready">PASSED</span><small>App and API can preview synthetic content locally.</small></div><div><b>TypeScript SDK</b><span className="pill ready">MOCK PASSED</span><small>Request construction verified; hosted API key still needed.</small></div><div><b>Python SDK</b><span className="pill ready">MOCK PASSED</span><small>Independent SDK request verified; hosted API key still needed.</small></div><div><b>MCP client and send</b><span className="pill ready">LIVE PASSED</span><small>One approved send; user reported Inbox receipt. Per-message lookup failed.</small></div><div><b>SMTP and plan gates</b><span className="pill neutral">NOT TESTED</span><small>Need account access and a separate test plan.</small></div></div><p className="hint">States used in this lab: not configured, ready, running, passed, failed, blocked, unsupported, and not tested. See docs/capability-matrix.md and results/evaluation.json for the dated record.</p></div>}

        <div className="bottom-grid"><section className="panel compact"><div className="panel-heading"><h2>Latest result</h2><span className="subtle">THIS SESSION</span></div>{result ? <pre className="result-json">{JSON.stringify(result, null, 2)}</pre> : <p className="empty">Run a local preview or API operation to see evidence here.</p>}</section><section className="panel compact"><div className="panel-heading"><h2>Activity</h2><span className="subtle">LOCAL SESSION</span></div>{activity.length ? <div className="activity">{activity.map((a, i) => <div key={i}><span className={`pill ${a.state === 'passed' ? 'ready' : 'blocked'}`}>{a.state}</span><b>{a.step}</b><small>{a.detail}</small></div>)}</div> : <p className="empty">No actions recorded yet.</p>}</section></div>
      </div>
    </main>
  </div>;
}
