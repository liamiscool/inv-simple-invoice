-- Organizations (future-proof, but single-org per user for MVP)
create table app_org (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id),
  created_at timestamptz default now()
);

-- Profiles
create table app_user (
  id uuid primary key references auth.users(id),
  org_id uuid not null references app_org(id),
  full_name text,
  default_currency char(3) default 'EUR',
  company_name text,
  company_address text,
  tax_id text,
  bank_details text, -- free text displayed on invoice
  created_at timestamptz default now()
);

-- Clients
create table client (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references app_org(id),
  name text not null,
  company text,
  email text,
  currency char(3) default 'EUR',
  notes text,
  created_at timestamptz default now()
);

-- Templates (curated & user-uploaded)
create table template (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references app_org(id), -- null for curated/global
  title text not null,
  kind text not null check (kind in ('curated','uploaded')),
  spec jsonb not null, -- structured layout/field map
  preview_url text,    -- storage public URL
  created_at timestamptz default now()
);

-- Invoices
create table invoice (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references app_org(id),
  client_id uuid not null references client(id),
  template_id uuid not null references template(id),
  number text not null, -- e.g., INV-2025-0007 (unique per org)
  issue_date date not null,
  due_date date,
  currency char(3) not null,
  status text not null check (status in
    ('draft','sent','partially_paid','paid','overdue','void')),
  notes text,
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  created_at timestamptz default now()
);

-- Invoice items
create table invoice_item (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoice(id) on delete cascade,
  position int not null,
  description text not null,
  qty numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  tax_rate numeric(6,3) not null default 0, -- e.g., 0.19
  line_total numeric(12,2) not null default 0
);

-- Manual payments (for partials)
create table invoice_payment (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoice(id) on delete cascade,
  date date not null,
  amount numeric(12,2) not null,
  method text default 'bank_transfer',
  notes text
);

-- Billing entitlements
create table plan_subscription (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references app_org(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null check (plan in ('free','pro_monthly','pro_yearly')),
  status text not null check (status in ('active','canceled','incomplete','past_due')),
  created_at timestamptz default now()
);

-- Sending counter for free-limit enforcement
create table send_counter (
  org_id uuid primary key references app_org(id),
  sent_count int not null default 0,
  updated_at timestamptz default now()
);

-- Create unique index for invoice numbers per org
create unique index invoice_number_org_uniq on invoice(org_id, number);

-- Enable RLS on all tables
alter table app_org enable row level security;
alter table app_user enable row level security;
alter table client enable row level security;
alter table template enable row level security;
alter table invoice enable row level security;
alter table invoice_item enable row level security;
alter table invoice_payment enable row level security;
alter table plan_subscription enable row level security;
alter table send_counter enable row level security;

-- RLS Policies

-- app_org policies
create policy "Users can view their own org" on app_org
  for select using (owner_id = auth.uid());

create policy "Users can create an org" on app_org
  for insert with check (owner_id = auth.uid());

-- app_user policies  
create policy "Users can view their own profile" on app_user
  for select using (id = auth.uid());

create policy "Users can update their own profile" on app_user
  for update using (id = auth.uid());

create policy "Users can insert their own profile" on app_user
  for insert with check (id = auth.uid());

-- Helper function to get user's org_id
create or replace function get_user_org_id()
returns uuid
language sql
security definer
as $$
  select org_id from app_user where id = auth.uid()
$$;

-- client policies
create policy "Users can view clients in their org" on client
  for select using (org_id = get_user_org_id());

create policy "Users can create clients in their org" on client
  for insert with check (org_id = get_user_org_id());

create policy "Users can update clients in their org" on client
  for update using (org_id = get_user_org_id());

create policy "Users can delete clients in their org" on client
  for delete using (org_id = get_user_org_id());

-- template policies
create policy "Users can view curated or their org templates" on template
  for select using (org_id is null or org_id = get_user_org_id());

create policy "Users can create templates in their org" on template
  for insert with check (org_id = get_user_org_id());

create policy "Users can update their org templates" on template
  for update using (org_id = get_user_org_id());

create policy "Users can delete their org templates" on template
  for delete using (org_id = get_user_org_id());

-- invoice policies
create policy "Users can view invoices in their org" on invoice
  for select using (org_id = get_user_org_id());

create policy "Users can create invoices in their org" on invoice
  for insert with check (org_id = get_user_org_id());

create policy "Users can update invoices in their org" on invoice
  for update using (org_id = get_user_org_id());

create policy "Users can delete invoices in their org" on invoice
  for delete using (org_id = get_user_org_id());

-- invoice_item policies
create policy "Users can view invoice items for their org invoices" on invoice_item
  for select using (
    exists (
      select 1 from invoice 
      where invoice.id = invoice_item.invoice_id 
      and invoice.org_id = get_user_org_id()
    )
  );

create policy "Users can manage invoice items for their org invoices" on invoice_item
  for all using (
    exists (
      select 1 from invoice 
      where invoice.id = invoice_item.invoice_id 
      and invoice.org_id = get_user_org_id()
    )
  );

-- invoice_payment policies
create policy "Users can view payments for their org invoices" on invoice_payment
  for select using (
    exists (
      select 1 from invoice 
      where invoice.id = invoice_payment.invoice_id 
      and invoice.org_id = get_user_org_id()
    )
  );

create policy "Users can manage payments for their org invoices" on invoice_payment
  for all using (
    exists (
      select 1 from invoice 
      where invoice.id = invoice_payment.invoice_id 
      and invoice.org_id = get_user_org_id()
    )
  );

-- plan_subscription policies
create policy "Users can view their org subscription" on plan_subscription
  for select using (org_id = get_user_org_id());

create policy "Users can manage their org subscription" on plan_subscription
  for all using (org_id = get_user_org_id());

-- send_counter policies
create policy "Users can view their org send counter" on send_counter
  for select using (org_id = get_user_org_id());

create policy "Users can manage their org send counter" on send_counter
  for all using (org_id = get_user_org_id());

-- Function to get next invoice number
create or replace function next_invoice_number(p_org_id uuid)
returns text
language plpgsql
as $$
declare
  v_year text;
  v_max_num int;
  v_new_num text;
begin
  v_year := to_char(current_date, 'YYYY');
  
  select max(cast(substring(number from '-(\d+)$') as int))
  into v_max_num
  from invoice
  where org_id = p_org_id
  and number like 'INV-' || v_year || '-%';
  
  v_max_num := coalesce(v_max_num, 0) + 1;
  v_new_num := 'INV-' || v_year || '-' || lpad(v_max_num::text, 4, '0');
  
  return v_new_num;
end;
$$;

-- Trigger to recalculate invoice totals
create or replace function recalculate_invoice_totals()
returns trigger
language plpgsql
as $$
declare
  v_subtotal numeric(12,2);
  v_tax_total numeric(12,2);
  v_total numeric(12,2);
  v_amount_paid numeric(12,2);
  v_invoice_id uuid;
begin
  -- Determine which invoice to update
  if TG_TABLE_NAME = 'invoice_item' then
    v_invoice_id := coalesce(NEW.invoice_id, OLD.invoice_id);
  else -- invoice_payment
    v_invoice_id := coalesce(NEW.invoice_id, OLD.invoice_id);
  end if;
  
  -- Calculate subtotal and tax from items
  select 
    coalesce(sum((qty * unit_price)::numeric(12,2)), 0),
    coalesce(sum((qty * unit_price * tax_rate)::numeric(12,2)), 0)
  into v_subtotal, v_tax_total
  from invoice_item
  where invoice_id = v_invoice_id;
  
  v_total := v_subtotal + v_tax_total;
  
  -- Calculate amount paid
  select coalesce(sum(amount), 0)
  into v_amount_paid
  from invoice_payment
  where invoice_id = v_invoice_id;
  
  -- Update invoice
  update invoice
  set 
    subtotal = v_subtotal,
    tax_total = v_tax_total,
    total = v_total,
    amount_paid = v_amount_paid,
    status = case
      when status = 'void' then 'void'
      when status = 'draft' then 'draft'
      when v_amount_paid >= v_total and v_total > 0 then 'paid'
      when v_amount_paid > 0 and v_amount_paid < v_total then 'partially_paid'
      when status = 'sent' and due_date < current_date then 'overdue'
      else status
    end
  where id = v_invoice_id;
  
  return NEW;
end;
$$;

-- Create triggers for automatic calculation
create trigger invoice_item_totals_trigger
after insert or update or delete on invoice_item
for each row execute function recalculate_invoice_totals();

create trigger invoice_payment_totals_trigger
after insert or update or delete on invoice_payment
for each row execute function recalculate_invoice_totals();