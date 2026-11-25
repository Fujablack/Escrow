'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
const N = (n) => '₦' + Number(n).toLocaleString();
export default function Deal() {
  const { id } = useParams();
  const [k, setK] = useState(''); const [d, setD] = useState(null); const [msg, setMsg] = useState('');
  const call = (b) => fetch('/api', { method: 'POST', body: JSON.stringify({ id, k, ...b }) }).then(r => r.json());
  const load = async () => k && setD(await call({ action: 'get' }));
  useEffect(() => { setK(new URLSearchParams(location.search).get('k') || ''); }, []);
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, [k]);
  if (!d) return <p>Loading…</p>;
  if (d.error) return <p className="err">{d.error}</p>;
  const buyer = d.role === 'buyer', s = d.status;
  const act = async (action) => { const r = await call({ action }); if (r.url) location.href = r.url; else if (r.error) alert(r.error); load(); };
  const send = async () => { if (!msg.trim()) return; await call({ action: 'message', body: msg }); setMsg(''); load(); };
  return (<>
    <h1>{d.item}</h1>
    <p className="s">Seller: {d.account_name}</p>
    <div className="card"><div className="big">{N(d.amount)}</div>
      <span className="tag">{{ open: 'Waiting for payment', paid: 'Payment secured', released: 'Seller paid', dispute: 'In dispute' }[s]}</span></div>
    {!buyer && s === 'open' && <div className="card">Send this link to the buyer:<br /><b style={{ wordBreak: 'break-all' }}>{location.origin}/d/{id}?k={d.buyer_key}</b>
      <button onClick={() => navigator.clipboard.writeText(`${location.origin}/d/${id}?k=${d.buyer_key}`)}>Copy link</button></div>}
    {!buyer && s === 'paid' && <div className="card">✅ Buyer has paid. Deliver the item now.</div>}
    {buyer && s === 'open' && <button onClick={() => act('pay')}>Pay {N(d.amount + d.fee)} (incl. {N(d.fee)} fee)</button>}
    {buyer && s === 'paid' && <><button onClick={() => confirm('Release money to seller?') && act('release')}>I got it – release money</button>
      <button className="link" onClick={() => confirm('Report a problem?') && act('dispute')}>There's a problem</button></>}
    {s === 'dispute' && <div className="card">We're reviewing this deal and will contact you in chat.</div>}
    <div className="card chat">{d.messages.map(m => <div className="m" key={m.id}><b>{m.who}</b><br />{m.body}</div>)}</div>
    <div className="row"><input placeholder="Message…" value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} /><button onClick={send}>Send</button></div>
  </>);
}
