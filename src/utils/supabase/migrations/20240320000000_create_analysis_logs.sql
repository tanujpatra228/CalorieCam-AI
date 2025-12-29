-- Create analysis_logs table
create table if not exists analysis_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  dish_name text not null,
  total_weight_g numeric not null,
  total_digestion_time_m integer not null,
  image_url text not null,
  macros jsonb not null,
  micros jsonb not null,
  notes text[] not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  total_calories_to_digest_kcal integer null,
  
  constraint analysis_logs_pkey primary key (id),
  constraint analysis_logs_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint fk_user foreign KEY (user_id) references auth.users (id)
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