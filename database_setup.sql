-- ==========================================
-- SCRIPT MAESTRO DE BASE DE DATOS - OCTOPUS
-- ==========================================

-- Limpieza preventiva (Opcional, usar con cuidado si hay datos reales)
-- drop table if exists public.recursos_academia;
-- drop table if exists public.eventos_calendario;
-- drop table if exists public.configuracion;
-- drop table if exists public.diagnosticos_completos;
-- drop table if exists public.diagnosticos_express;
-- drop table if exists public.usuarios;

-- Enable Row Level Security (RLS) general
alter default privileges revoke execute on functions from public;

-- 1. TABLA: USUARIOS (Extiende auth.users)
create table if not exists public.usuarios (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  business_name text,
  role text default 'user', -- 'user' | 'admin' | 'consultant'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.usuarios enable row level security;

create policy "Perfiles publicos visibles por todos." on public.usuarios for select using (true);
create policy "Usuarios pueden crear su propio perfil." on public.usuarios for insert with check (auth.uid() = id);
create policy "Usuarios pueden editar su propio perfil." on public.usuarios for update using (auth.uid() = id);

-- 2. TABLA: DIAGNOSTICOS_EXPRESS (Antes leads)
create table if not exists public.diagnosticos_express (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Datos de Contacto
  contact_name text,
  contact_email text,
  contact_phone text,
  business_name text,
  city text,
  
  -- Snapshot del Negocio
  business_type text,
  monthly_revenue numeric,
  
  -- Resultados Diagnóstico
  score_global numeric,
  score_financial numeric,
  score_7p numeric,
  profile_name text,
  
  -- Gestión de Estado (CRM)
  status text default 'new', -- 'Rojo', 'Amarillo', 'Verde' (del calculo) o CRM status
  crm_status text default 'nuevo', -- 'nuevo', 'contactado', 'cerrado'
  notas_consultor text,
  ultima_accion timestamp with time zone default now(),
  
  -- Metadata
  source text default 'web_quick_diagnostic',
  full_data jsonb
);

alter table public.diagnosticos_express enable row level security;

create policy "Cualquiera puede insertar diagnosticos express." on public.diagnosticos_express for insert with check (true);
create policy "Solo admin ve diagnosticos express." on public.diagnosticos_express for select using (
  auth.uid() in (select id from public.usuarios where role in ('admin', 'consultant'))
);
create policy "Solo admin edita diagnosticos express." on public.diagnosticos_express for update using (
  auth.uid() in (select id from public.usuarios where role in ('admin', 'consultant'))
);

-- 3. TABLA: DIAGNOSTICOS_COMPLETOS (Antes diagnostics)
create table if not exists public.diagnosticos_completos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Inputs
  month text,
  sales_food numeric,
  sales_beverage numeric,
  sales_other numeric,
  cost_food numeric,
  cost_beverage numeric,
  labor_kitchen numeric,
  labor_service numeric,
  labor_other numeric,
  rent numeric,
  utilities numeric,
  
  -- Resultados
  total_sales numeric,
  gross_margin numeric,
  net_result numeric,
  break_even_point numeric,
  
  -- Metadata
  notes text
);

alter table public.diagnosticos_completos enable row level security;

create policy "Usuarios ven sus propios diagnosticos." on public.diagnosticos_completos for select using (auth.uid() = user_id);
create policy "Usuarios crean sus propios diagnosticos." on public.diagnosticos_completos for insert with check (auth.uid() = user_id);

-- 4. TABLA: CONFIGURACION (Antes admin_config)
create table if not exists public.configuracion (
    key text primary key,
    value jsonb not null,
    description text,
    group_name text, -- 'UMBRALES', 'TEXTOS', 'CONTACTO'
    updated_at timestamp with time zone default now()
);

alter table public.configuracion enable row level security;

create policy "Configuracion publica lectura." on public.configuracion for select using (true);
create policy "Configuracion solo admin modifica." on public.configuracion for all using (
  auth.uid() in (select id from public.usuarios where role = 'admin')
);

-- Seed de Configuración
insert into public.configuracion (key, value, description, group_name) values
('contacto_whatsapp', '"5493517736981"', 'Número de WhatsApp principal', 'CONTACTO'),
('umbral_costo_alto', '40', 'Porcentaje alerta costo mercadería', 'UMBRALES')
on conflict (key) do nothing;

-- 5. TABLA: EVENTOS_CALENDARIO (Antes calendar_events)
create table if not exists public.eventos_calendario (
    id uuid default gen_random_uuid() primary key,
    titulo text not null,
    tipo text not null, -- 'feriado', 'clima', 'tendencia'
    fecha_inicio date not null,
    fecha_fin date not null,
    mensaje text,
    prioridad int default 1,
    created_at timestamp with time zone default now()
);

alter table public.eventos_calendario enable row level security;
create policy "Eventos lectura publica." on public.eventos_calendario for select using (true);
create policy "Eventos solo admin modifica." on public.eventos_calendario for all using (
  auth.uid() in (select id from public.usuarios where role = 'admin')
);

-- 6. TABLA: RECURSOS_ACADEMIA (Antes academy_resources)
create table if not exists public.recursos_academia (
    id uuid default gen_random_uuid() primary key,
    titulo text not null,
    tipo text not null, -- 'video', 'plantilla', 'guia'
    url text,
    thumbnail_url text,
    descripcion text,
    es_premium boolean default false,
    created_at timestamp with time zone default now()
);

alter table public.recursos_academia enable row level security;
create policy "Recursos lectura publica." on public.recursos_academia for select using (true);
create policy "Recursos solo admin modifica." on public.recursos_academia for all using (
  auth.uid() in (select id from public.usuarios where role = 'admin')
);

-- 7. TRIGGERS
-- Trigger timestamp update
create or replace function public.handle_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_usuarios_updated before update on public.usuarios for each row execute procedure public.handle_updated_at();

-- Trigger new profile on signup
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.usuarios (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Remove old trigger if exists to avoid errors
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
