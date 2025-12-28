-- Allow consultants to modify calendar events
drop policy if exists "Eventos solo admin modifica." on public.eventos_calendario;
create policy "Admin y Consultores modifican eventos." on public.eventos_calendario for all using (
  auth.uid() in (select id from public.usuarios where role in ('admin', 'consultant'))
);

-- Allow consultants to modify academy resources
drop policy if exists "Recursos solo admin modifica." on public.recursos_academia;
create policy "Admin y Consultores modifican recursos." on public.recursos_academia for all using (
  auth.uid() in (select id from public.usuarios where role in ('admin', 'consultant'))
);

-- Allow consultants to modify config (optional, maybe unsafe, but keeps standard)
drop policy if exists "Configuracion solo admin modifica." on public.configuracion;
create policy "Admin y Consultores modifican configuracion." on public.configuracion for all using (
  auth.uid() in (select id from public.usuarios where role in ('admin', 'consultant'))
);
