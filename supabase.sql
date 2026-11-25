create table deals (
  id uuid primary key default gen_random_uuid(),
  item text not null, amount int not null, fee int not null,
  account_name text, recipient text,
  status text not null default 'open', -- open, paid, released, dispute
  seller_key text not null, buyer_key text not null,
  created_at timestamptz default now()
);
create table messages (
  id bigserial primary key,
  deal_id uuid references deals(id), who text, body text,
  created_at timestamptz default now()
);
alter table deals enable row level security;
alter table messages enable row level security;
