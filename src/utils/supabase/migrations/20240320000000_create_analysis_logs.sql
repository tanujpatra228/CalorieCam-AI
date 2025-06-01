-- Create analysis_logs table
create table if not exists analysis_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  dish_name text not null,
  total_weight_g numeric not null,
  total_digestion_time_m integer not null,
  image_url text not null,
  macros jsonb not null,
  micros jsonb not null,
  notes text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint fk_user foreign key (user_id) references auth.users(id)
);

-- Enable Row Level Security
alter table analysis_logs enable row level security;

-- Create policies
create policy "Users can view their own logs"
  on analysis_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own logs"
  on analysis_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own logs"
  on analysis_logs for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists idx_analysis_logs_user_id on analysis_logs(user_id);
create index if not exists idx_analysis_logs_created_at on analysis_logs(created_at desc); 