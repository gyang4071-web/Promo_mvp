-- Выполните один раз в Supabase: SQL Editor → New query → вставить → Run.
-- Создаёт таблицу брифов, журнал загрузок и закрытое хранилище файлов.

create table if not exists public.briefs (
  id             uuid primary key,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  brand          text not null,
  contact_name   text not null,
  contact_email  text not null,
  locale         text not null default 'ru',
  brief_version  int  not null default 1,
  answers        jsonb not null,
  files          jsonb not null default '[]'::jsonb,
  ip_hash        text,
  user_agent     text,
  email_status   text not null default 'pending' check (email_status in ('pending', 'sent', 'failed')),
  email_id       text,
  email_error    text,
  emailed_at     timestamptz
);

create index if not exists briefs_created_at_idx on public.briefs (created_at desc);
create index if not exists briefs_ip_recent_idx on public.briefs (ip_hash, created_at);

create or replace function public.briefs_touch() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists briefs_touch on public.briefs;
create trigger briefs_touch before update on public.briefs
  for each row execute function public.briefs_touch();

create table if not exists public.brief_uploads (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  ip_hash        text not null,
  submission_id  uuid not null,
  path           text not null,
  size           bigint
);
create index if not exists brief_uploads_ip_recent_idx on public.brief_uploads (ip_hash, created_at);

-- Доступ только с сервера (ключ service_role). Публичный ключ не видит ничего.
alter table public.briefs enable row level security;
alter table public.brief_uploads enable row level security;

-- Закрытый бакет: до 50 МБ на файл, только разрешённые типы.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brief-files',
  'brief-files',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'video/mp4',
    'video/quicktime',
    'application/zip',
    'application/postscript',
    'image/vnd.adobe.photoshop'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
