create table if not exists public.ledger_state (
	id bigint primary key default 1 check (id = 1),
	data jsonb not null default '{"students":[],"payables":[],"payments":[],"auditLogs":[],"editRequests":[]}'::jsonb,
	updated_by uuid references auth.users(id) on delete set null,
	updated_at timestamptz not null default now()
);

alter table public.ledger_state enable row level security;

create policy "Ledger users can read shared state"
	on public.ledger_state for select
	to authenticated
	using ((select auth.uid()) is not null);

create policy "Staff can create shared state"
	on public.ledger_state for insert
	to authenticated
	with check ((select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'treasurer'));

create policy "Staff can update shared state"
	on public.ledger_state for update
	to authenticated
	using ((select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'treasurer'))
	with check ((select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'treasurer'));

grant select on public.ledger_state to authenticated;
grant insert, update on public.ledger_state to authenticated;
