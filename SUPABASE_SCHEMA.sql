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

-- ============================================================================
-- USER_MEMORY (Persistent Memory - OpenClaw style)
-- ============================================================================
create table user_memory (
  user_id text primary key,
  wallet_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_active_at timestamp with time zone default timezone('utc'::text, now()) not null,
  preferences jsonb default '{}'::jsonb,
  context jsonb default '{}'::jsonb,
  execution_history jsonb default '[]'::jsonb,
  conversation_history jsonb default '[]'::jsonb,
  stats jsonb default '{}'::jsonb
);

-- Index for fast wallet lookups
create index idx_user_memory_wallet on user_memory(wallet_address);

-- ============================================================================
-- SKILLS (Plugin/Skill System - OpenClaw/ClawHub style)
-- ============================================================================
create table skills (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  slug text not null unique,
  description text,
  author text not null,
  version text default '1.0.0',
  category text default 'general', -- 'trading', 'analysis', 'notification', 'integration', 'utility'
  tags text[] default '{}',
  config_schema jsonb, -- JSON Schema for skill configuration
  code_url text, -- GitHub or IPFS URL
  icon_url text,
  downloads integer default 0,
  rating numeric(2,1) default 0,
  is_verified boolean default false,
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SKILL_INSTALLS (User's installed skills)
create table skill_installs (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  skill_id uuid references skills(id) not null,
  config jsonb default '{}'::jsonb, -- User's configuration for the skill
  is_enabled boolean default true,
  installed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, skill_id)
);

-- SKILL_REVIEWS (User reviews for skills)
create table skill_reviews (
  id uuid default uuid_generate_v4() primary key,
  skill_id uuid references skills(id) not null,
  user_id text not null,
  rating integer check (rating >= 1 and rating <= 5),
  review text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(skill_id, user_id)
);

-- ============================================================================
-- CHAT_INTEGRATIONS (Multi-platform messaging)
-- ============================================================================
create table chat_integrations (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  platform text not null, -- 'telegram', 'discord', 'slack', 'whatsapp'
  platform_user_id text not null,
  platform_username text,
  access_token text, -- Encrypted
  refresh_token text, -- Encrypted
  is_active boolean default true,
  permissions jsonb default '["read", "write"]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_message_at timestamp with time zone,
  unique(platform, platform_user_id)
);

-- Index for platform lookups
create index idx_chat_integrations_platform on chat_integrations(platform, platform_user_id);

-- ============================================================================
-- RLS POLICIES for new tables
-- ============================================================================
alter table user_memory enable row level security;
alter table skills enable row level security;
alter table skill_installs enable row level security;
alter table skill_reviews enable row level security;
alter table chat_integrations enable row level security;

-- Skills are viewable by everyone
create policy "Skills are public" on skills
  for select using (true);

-- User memory is only accessible by the user
create policy "Users can access own memory" on user_memory
  for all using (true); -- Using API key auth, not Supabase auth

-- Skill installs for user
create policy "Users can manage skill installs" on skill_installs
  for all using (true);

-- Chat integrations for user
create policy "Users can manage chat integrations" on chat_integrations
  for all using (true);
