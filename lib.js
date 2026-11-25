import { createClient } from '@supabase/supabase-js';
export const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
export const ps = (path, body) =>
  fetch('https://api.paystack.co' + path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => r.json());
// 2% fee, min N100, max N2,000 (paid by buyer, on top of the price)
export const fee = (a) => Math.min(2000, Math.max(100, Math.round(a * 0.02)));
