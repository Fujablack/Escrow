import crypto from 'crypto';
import { db } from '../../../lib';
export async function POST(req) {
  const raw = await req.text();
  const sig = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(raw).digest('hex');
  if (sig !== req.headers.get('x-paystack-signature')) return new Response('no', { status: 401 });
  const e = JSON.parse(raw);
  if (e.event === 'charge.success') {
    const { data: d } = await db.from('deals').select('*').eq('id', e.data.metadata?.deal).single();
    if (d && e.data.amount >= (d.amount + d.fee) * 100)
      await db.from('deals').update({ status: 'paid' }).eq('id', d.id).eq('status', 'open');
  }
  return new Response('ok');
}
