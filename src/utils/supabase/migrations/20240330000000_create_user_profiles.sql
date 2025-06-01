-- Create user_profiles table
create table public.user_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Basic Info
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  
  -- Targets
  daily_calories_budget integer,
  daily_protein_target_g integer,
  
  -- Activity Level (for BMR calculation)
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  
  -- Goals
  goal text check (goal in ('lose_weight', 'maintain', 'gain_muscle')),
  
  -- Constraints
  constraint valid_height check (height_cm > 0 and height_cm < 300),
  constraint valid_weight check (weight_kg > 0 and weight_kg < 500),
  constraint valid_calories check (daily_calories_budget > 0 and daily_calories_budget < 10000),
  constraint valid_protein check (daily_protein_target_g > 0 and daily_protein_target_g < 500)
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Create policies
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

-- Create function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
drop trigger if exists handle_updated_at on public.user_profiles;
create trigger handle_updated_at
  before update on public.user_profiles
  for each row
  execute procedure public.handle_updated_at(); 