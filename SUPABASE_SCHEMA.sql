-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users not null primary key,
  wallet_address text unique,
  username text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- STRATEGIES (Saved User Strategies)
create table strategies (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  name text not null,
  description text,
  config jsonb not null, -- The technical configuration of the strategy
  status text default 'draft', -- 'draft', 'active', 'paused'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AGENT_LOGS (Execution logs from the agent)
create table agent_logs (
  id uuid default uuid_generate_v4() primary key,
  strategy_id uuid references strategies(id),
  level text not null, -- 'info', 'warning', 'error', 'success'
  message text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Security)
alter table profiles enable row level security;
alter table strategies enable row level security;
alter table agent_logs enable row level security;

-- Public profiles are viewable by everyone
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);

-- Users can insert their own profile
create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

-- Users can update own profile
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Strategies are viewable by owner
create policy "Strategies are viewable by owner" on strategies
  for select using (auth.uid() = user_id);

-- Strategies can be created by authenticated users
create policy "Users can create strategies" on strategies
  for insert with check (auth.uid() = user_id);

-- Strategies can be updated by owner
create policy "Users can update own strategies" on strategies
  for update using (auth.uid() = user_id);
