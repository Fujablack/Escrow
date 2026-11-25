'use client';
import { useEffect, useState } from 'react';
export default function Home() {
  const [banks, setBanks] = useState([]);
  const [f, setF] = useState({ item: '', amount: '', bank: '', account: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { fetch('/api').then(r => r.json()).then(setBanks); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function go() {
    setBusy(true); setErr('');
    const r = await fetch('/api', { method: 'POST', body: JSON.stringify({ action: 'create', ...f }) });
    const d = await r.json();
    if (d.error) { setErr(d.error); setBusy(false); return; }
    location.href = `/d/${d.id}?k=${d.seller_key}`;
  }
  return (<>
    <h1>Sell safely</h1><p className="s">Buyer pays us. You deliver. You get paid.</p>
    <input placeholder="What are you selling?" value={f.item} onChange={set('item')} />
    <input placeholder="Price (₦)" type="number" value={f.amount} onChange={set('amount')} />
    <select value={f.bank} onChange={set('bank')}><option value="">Your bank</option>
      {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}</select>
    <input placeholder="Account number" maxLength={10} value={f.account} onChange={set('account')} />
    {err && <p className="err">{err}</p>}
    <button disabled={busy} onClick={go}>{busy ? 'Creating…' : 'Create link'}</button>
  </>);
}
