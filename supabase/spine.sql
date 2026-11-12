-- OPMT 375 Supply Lab: the shared spine
-- Run once in your Supabase project: SQL Editor → New query → paste this whole file → Run.
-- It creates four tables every team shares, turns on access rules, and adds sample rows.
--
--   parties   who and where (a farm, an elevator, a plant, a store), named by a GLN
--   products  what kind of thing, named by a GTIN, with its unit and grade
--   lots      one batch of a product, named by a lot code
--   events    what happened: one row per handoff or change (the relay's index card, done right)
--
-- All codes here are FAKE, for class use only. Every GLN and GTIN starts with 0999.
-- Replace 0999 with your team's assigned prefix when you add your own rows.

-- 1. Parties: who and where ---------------------------------------------------
create table if not exists parties (
  gln         text primary key check (gln ~ '^[0-9]{13}$'),       -- 13-digit location number
  name        text not null,
  role        text not null,                                       -- e.g. farm, elevator, processor, carrier, store
  county      text,                                                -- lets a weather alert find the farm
  team        text                                                 -- which class team plays this party
);

-- 2. Products: what kind of thing ---------------------------------------------
create table if not exists products (
  gtin        text primary key check (gtin ~ '^[0-9]{14}$'),      -- 14-digit trade item number
  name        text not null,
  uom         text not null,                                       -- unit: bu, cwt, lb, ton, each, head
  grade       text                                                 -- e.g. U.S. No. 2 Yellow
);

-- 3. Lots: one batch of a product ---------------------------------------------
create table if not exists lots (
  lot_code    text primary key,
  gtin        text not null references products (gtin),
  origin_gln  text not null references parties (gln),             -- where the batch started
  created_on  date not null default current_date
);

-- 4. Events: what happened ----------------------------------------------------
-- Event types follow FDA FSMA 204 critical tracking events, used here as a teaching model.
create table if not exists events (
  event_id          bigint generated always as identity primary key,
  event_type        text not null check (event_type in
                      ('harvest', 'cooling', 'initial_packing', 'shipping', 'receiving', 'transformation')),
  gtin              text not null references products (gtin),
  lot_code          text references lots (lot_code),
  input_lot_code    text references lots (lot_code),                -- transformation only: the lot it was made from
  quantity         numeric not null check (quantity > 0),
  uom               text not null,
  from_gln          text references parties (gln),
  to_gln            text references parties (gln),
  occurred_at       timestamptz not null default now(),
  recorded_by_team  text not null
);

create index if not exists events_lot_idx on events (lot_code);

-- 5. Access rules -------------------------------------------------------------
-- The key your storefront uses is public, so these rules decide what a browser may do.
-- For now anyone may READ; only you, signed in to the Supabase dashboard, may change rows.
-- In Session 6 we add rules that let each team write its own events.
alter table parties  enable row level security;
alter table products enable row level security;
alter table lots     enable row level security;
alter table events   enable row level security;

drop policy if exists "public read" on parties;
drop policy if exists "public read" on products;
drop policy if exists "public read" on lots;
drop policy if exists "public read" on events;
create policy "public read" on parties  for select using (true);
create policy "public read" on products for select using (true);
create policy "public read" on lots     for select using (true);
create policy "public read" on events   for select using (true);

-- 6. Sample rows: the turkey chain from the Session 4 relay -------------------
insert into parties (gln, name, role, county, team) values
  ('0999000000017', 'Sample Feed Mill',        'feed mill', 'Kandiyohi', 'sample'),
  ('0999000000024', 'Sample Turkey Grower',    'farm',      'Stearns',   'sample'),
  ('0999000000031', 'Sample Turkey Processor', 'processor', 'Kandiyohi', 'sample'),
  ('0999000000048', 'Sample Grocery Store',    'store',     'Hennepin',  'sample')
on conflict (gln) do nothing;

insert into products (gtin, name, uom, grade) values
  ('09990000000016', 'Turkey feed, corn-soy ration', 'ton',  null),
  ('09990000000023', 'Live turkey',                  'head', null),
  ('09990000000030', 'Whole turkey, frozen, 16-18 lb', 'each', 'USDA Grade A'),
  ('09990000000047', 'Yellow corn',                  'bu',   'U.S. No. 2 Yellow')
on conflict (gtin) do nothing;

insert into lots (lot_code, gtin, origin_gln, created_on) values
  ('LOT-2026-BARN-3', '09990000000023', '0999000000024', '2026-11-02'),
  ('LOT-2026-PACK-11', '09990000000030', '0999000000031', '2026-11-06')
on conflict (lot_code) do nothing;

-- Only add sample events once, so running the file twice does not double them.
insert into events (event_type, gtin, lot_code, input_lot_code, quantity, uom, from_gln, to_gln, occurred_at, recorded_by_team)
select * from (values
  ('shipping',       '09990000000023', 'LOT-2026-BARN-3',  null,              20::numeric, 'head', '0999000000024', '0999000000031', timestamptz '2026-11-04 07:30-06', 'sample'),
  ('receiving',      '09990000000023', 'LOT-2026-BARN-3',  null,              20::numeric, 'head', '0999000000024', '0999000000031', timestamptz '2026-11-04 10:15-06', 'sample'),
  ('transformation', '09990000000030', 'LOT-2026-PACK-11', 'LOT-2026-BARN-3', 20::numeric, 'each', '0999000000031', '0999000000031', timestamptz '2026-11-06 14:00-06', 'sample'),
  ('shipping',       '09990000000030', 'LOT-2026-PACK-11', null,              12::numeric, 'each', '0999000000031', '0999000000048', timestamptz '2026-11-09 06:00-06', 'sample')
) as v
where not exists (select 1 from events where recorded_by_team = 'sample');

-- Try it: Barn 3 failed inspection. Where did its turkeys go?
--   select e.event_type, e.lot_code, e.quantity, e.uom, p.name as went_to, e.occurred_at
--   from events e join parties p on p.gln = e.to_gln
--   where e.lot_code = 'LOT-2026-BARN-3'
--      or e.lot_code in (select lot_code from events where input_lot_code = 'LOT-2026-BARN-3')
--   order by e.occurred_at;
