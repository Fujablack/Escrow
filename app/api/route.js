import crypto from 'crypto';
import { db, ps, fee } from '../../lib';
const J = (d, s = 200) => Response.json(d, { status: s });
const key = () => crypto.randomBytes(12).toString('hex');

export async function GET() {
  const r = await ps('/bank?country=nigeria&perPage=200&currency=NGN');
  return J((r.data || []).map((b) => ({ name: b.name, code: b.code })));
}

export async function POST(req) {
  const b = await req.json();
  if (b.action === 'create') {
    const amount = parseInt(b.amount);
    if (!b.item?.trim() || !(amount >= 1000) || !b.bank || !/^\d{10}$/.test(b.account))
      return J({ error: 'Check your details (minimum ₦1,000, 10-digit account number).' }, 400);
    const r = await ps(`/bank/resolve?account_number=${b.account}&bank_code=${b.bank}`);
    if (!r.status) return J({ error: 'Could not find that bank account.' }, 400);
    const rc = await ps('/transferrecipient', { type: 'nuban', name: r.data.account_name, account_number: b.account, bank_code: b.bank, currency: 'NGN' });
    if (!rc.status) return J({ error: 'Bank account could not be saved.' }, 400);
    const { data, error } = await db.from('deals').insert({
      item: b.item.trim(), amount, fee: fee(amount), account_name: r.data.account_name,
      recipient: rc.data.recipient_code, seller_key: key(), buyer_key: key(),
    }).select().single();
    if (error) return J({ error: 'Database: ' + error.message }, 500);
    return J({ id: data.id, seller_key: data.seller_key });
  }

  const { data: d } = await db.from('deals').select('*').eq('id', b.id).single();
  const role = !d ? null : b.k === d.seller_key ? 'seller' : b.k === d.buyer_key ? 'buyer' : null;
  if (!role) return J({ error: 'Invalid link.' }, 403);

  if (b.action === 'get') {
    const { data: messages } = await db.from('messages').select('id,who,body').eq('deal_id', d.id).order('id');
    return J({ item: d.item, amount: d.amount, fee: d.fee, status: d.status, account_name: d.account_name, role, messages,
      buyer_key: role === 'seller' ? d.buyer_key : undefined });
  }
  if (b.action === 'message') {
    await db.from('messages').insert({ deal_id: d.id, who: role, body: String(b.body).slice(0, 500) });
    return J({ ok: 1 });
  }
  if (role !== 'buyer') return J({ error: 'Only the buyer can do this.' }, 403);

  if (b.action === 'pay' && d.status === 'open') {
    const r = await ps('/transaction/initialize', {
      email: `buyer-${d.id.slice(0, 8)}@escrow.app`, amount: (d.amount + d.fee) * 100,
      reference: `${d.id}_${Date.now()}`, metadata: { deal: d.id },
      callback_url: `${process.env.APP_URL}/d/${d.id}?k=${d.buyer_key}`,
    });
    return r.status ? J({ url: r.data.authorization_url }) : J({ error: 'Payment could not start.' }, 500);
  }
  if (b.action === 'release') {
    const { data: u } = await db.from('deals').update({ status: 'released' }).eq('id', d.id).eq('status', 'paid').select();
    if (!u?.length) return J({ error: 'Not available.' }, 400);
    const t = await ps('/transfer', { source: 'balance', amount: d.amount * 100, recipient: d.recipient, reason: d.item.slice(0, 40), reference: d.id });
    if (!t.status) { await db.from('deals').update({ status: 'paid' }).eq('id', d.id); return J({ error: 'Payout failed. Try again.' }, 500); }
    return J({ ok: 1 });
  }
  if (b.action === 'dispute') {
    await db.from('deals').update({ status: 'dispute' }).eq('id', d.id).eq('status', 'paid');
    return J({ ok: 1 });
  }
  return J({ error: 'Unknown action.' }, 400);
}
