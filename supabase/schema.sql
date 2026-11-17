-- Company Leave Tracker Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Roles
create table public.roles (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null, -- admin, manager, employee, approver
  can_approve boolean default false,
  can_self_approve boolean default false,
  can_modify_approved boolean default false,
  created_at timestamptz default now()
);

-- Users (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  full_name text,
  role_id uuid references public.roles(id),
  employment_start_date date, -- required on creation
  birthday date, -- for calendar
  vacation_days_annual integer default 20,
  sick_days_annual integer default 10,
  starting_vacation_balance numeric default 0, -- days already available at system start / employment
  carry_forward_max integer default 5,
  telegram_chat_id bigint,
  created_at timestamptz default now()
);

-- Leave balances per year
create table public.leave_balances (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  year integer not null,
  vacation_allocated numeric,
  vacation_taken numeric default 0,
  sick_taken numeric default 0,
  special_taken numeric default 0,
  carry_forward numeric default 0,
  unique(user_id, year)
);

-- Leave requests
create table public.leave_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('vacation', 'special', 'medical')),
  start_date date not null,
  end_date date not null,
  days numeric not null,
  status text default 'pending' check (status in ('pending', 'approved', 'denied', 'cancelled')),
  reason text not null,
  approved_by uuid references public.profiles(id),
  cancelled_by uuid references public.profiles(id),
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Request change history
create table public.leave_request_history (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid references public.leave_requests(id) on delete cascade,
  action text not null check (action in ('created', 'edited', 'deleted', 'approved', 'denied', 'cancelled', 'pulled_back')),
  changed_by uuid references public.profiles(id),
  old_data jsonb,
  new_data jsonb,
  comment text,
  created_at timestamptz default now()
);

-- Company closures and Aruba holidays
create table public.company_closures (
  id uuid primary key default uuid_generate_v4(),
  date date unique not null,
  name text not null,
  type text check (type in ('aruba_holiday', 'company_closure')),
  year integer
);

-- Rules
create table public.rules (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  config jsonb,
  active boolean default true
);

-- Audit logs
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  action text not null,
  details jsonb,
  ip_address text,
  created_at timestamptz default now()
);

-- Security events
create table public.security_events (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  details jsonb,
  ip_address text,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.leave_requests enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leave_request_history enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can view own requests" on public.leave_requests for select using (auth.uid() = user_id);
create policy "Users can insert own requests" on public.leave_requests for insert with check (auth.uid() = user_id);
create policy "Users can update own pending requests" on public.leave_requests for update using (auth.uid() = user_id and status = 'pending');
create policy "Users can delete own pending requests" on public.leave_requests for delete using (auth.uid() = user_id and status = 'pending');

-- Approvers can see all requests (expand with role check in app)
create policy "Approvers can view all requests" on public.leave_requests for select using (true);

create policy "Users can view history of own requests" on public.leave_request_history for select using (
  exists (select 1 from public.leave_requests r where r.id = request_id and r.user_id = auth.uid())
);
