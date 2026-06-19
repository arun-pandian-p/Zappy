-- Create item-images bucket
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do update set public = true;

-- Storage policies for item-images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'item-images' );

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check ( bucket_id = 'item-images' and auth.role() = 'authenticated' );

create policy "Authenticated users can update their images"
  on storage.objects for update
  using ( bucket_id = 'item-images' and auth.role() = 'authenticated' );

create policy "Authenticated users can delete images"
  on storage.objects for delete
  using ( bucket_id = 'item-images' and auth.role() = 'authenticated' );

-- Table: image_library
create table public.image_library (
    id uuid default gen_random_uuid() primary key,
    image_url text not null,
    item_name text not null,
    category_name text,
    source text not null check (source in ('unsplash', 'ai', 'upload', 'ocr')),
    hash text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: image_tags
create table public.image_tags (
    id uuid default gen_random_uuid() primary key,
    image_id uuid references public.image_library(id) on delete cascade,
    tag text not null
);

-- Table: image_usage
create table public.image_usage (
    id uuid default gen_random_uuid() primary key,
    image_id uuid references public.image_library(id) on delete cascade,
    restaurant_id uuid references public.restaurants(id) on delete cascade,
    menu_item_id uuid references public.menu_items(id) on delete cascade,
    usage_count integer default 1
);

-- Indexes for performance
create index idx_image_library_name on public.image_library(item_name);
create index idx_image_library_category on public.image_library(category_name);
create index idx_image_library_hash on public.image_library(hash);
create index idx_image_tags_tag on public.image_tags(tag);
create index idx_image_usage_item on public.image_usage(menu_item_id);

-- RLS for image_library
alter table public.image_library enable row level security;

create policy "Everyone can view image library"
  on public.image_library for select
  using (true);

create policy "Authenticated users can insert image library"
  on public.image_library for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update image library"
  on public.image_library for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete image library"
  on public.image_library for delete
  using (auth.role() = 'authenticated');

-- RLS for image_tags
alter table public.image_tags enable row level security;

create policy "Everyone can view image tags"
  on public.image_tags for select
  using (true);

create policy "Authenticated users can manage image tags"
  on public.image_tags for all
  using (auth.role() = 'authenticated');

-- RLS for image_usage
alter table public.image_usage enable row level security;

create policy "Everyone can view image usage"
  on public.image_usage for select
  using (true);

create policy "Authenticated users can manage image usage"
  on public.image_usage for all
  using (auth.role() = 'authenticated');
