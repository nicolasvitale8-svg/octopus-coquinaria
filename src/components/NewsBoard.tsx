import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { NewsBoardItem, NewsBoardItemType } from '../types';
import { Lightbulb, Tag, Rocket, Radar, ArrowRight, Clock, X } from 'lucide-react';

/**
 * NewsBoard — Pizarra de Novedades / Curaduría Semanal · FASE 2 HUD
 *
 * Refactor del estilo gradient/rounded-2.5rem hacia HUD/terminal:
 *   - Card con corner brackets phosphor (TL+BR), sin rounded
 *   - Iconos en frame cuadrado, no círculo. Color unificado phosphor.
 *   - Tipo (TIP/DESCUENTO/NOVEDAD_APP/RADAR): kicker mono uppercase
 *   - Tag (#capacitación) en chip mono cuadrado, no pill
 *   - Modal en HUD frame, sin rounded
 *   - Doc-code CPD-HOM-NEWS-001 al pie
 *
 * Fallback: si supabase no devuelve items, usa FALLBACK_ITEMS
 * (3 items curados manualmente) para que la sección siempre tenga
 * contenido y no genere aire muerto entre las secciones vecinas.
 */

const FALLBACK_ITEMS: NewsBoardItem[] = [
  {
    id: 'fallback-1',
    type: 'TIP',
    title: 'Carta de otoño: rotá 20% sin romper stock',
    summary:
      'Recortá productos de bajo movimiento, sumá 3 platos base de estación (guiso/sopa/pasta), ajustá mise en place y pasá compras a rotación semanal. Menos merma, más margen.',
    tag: 'temporada',
    cta_label: 'Ver guía completa',
    cta_url: '/academy',
    priority: 1,
    is_visible: true,
    created_at: new Date().toISOString(),
  } as NewsBoardItem,
  {
    id: 'fallback-2',
    type: 'NOVEDAD_APP',
    title: 'Plantilla CMV básico: calculá costo real por plato',
    summary:
      'Cargá insumos, receta, porciones y precio. Te devuelve CMV por porción y marca si el plato está rentable o te está comiendo vivo. Útil para auditar carta entera.',
    tag: 'costos',
    cta_label: 'Descargar plantilla',
    cta_url: '/academy',
    priority: 2,
    is_visible: true,
    created_at: new Date().toISOString(),
  } as NewsBoardItem,
  {
    id: 'fallback-3',
    type: 'RADAR',
    title: 'Auditoría Express (30 min): detectá fugas hoy',
    summary:
      "Checklist rápido en 30': depósito/cámaras, producción y servicio. Marcás OK/NO, registrás evidencia y te llevás 3 acciones inmediatas según puntaje.",
    tag: 'operaciones',
    cta_label: 'Abrir auditoría',
    cta_url: '/quick-diagnostic',
    priority: 3,
    is_visible: true,
    created_at: new Date().toISOString(),
  } as NewsBoardItem,
];

const NewsBoard: React.FC = () => {
  const [items, setItems] = useState<NewsBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<NewsBoardItem | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('public_board_items')
        .select('*')
        .eq('is_visible', true)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) console.error('NewsBoard Supabase Error:', error);
      if (data) setItems(data);
      setLoading(false);
    };
    fetchItems();
  }, []);

  const getTypeMeta = (type: NewsBoardItemType) => {
    switch (type) {
      case 'TIP':         return { icon: Lightbulb, label: 'Tip Estratégico' };
      case 'DESCUENTO':   return { icon: Tag,        label: 'Oportunidad' };
      case 'NOVEDAD_APP': return { icon: Rocket,     label: 'Novedad App' };
      case 'RADAR':       return { icon: Radar,      label: 'Radar Cephalopod' };
      default:            return { icon: Lightbulb,  label: 'Información' };
    }
  };

  if (loading) return null;
  // Si supabase no devuelve nada, usamos fallback en lugar de null
  // para evitar gap muerto entre las secciones vecinas (py-24 + py-24).
  const displayItems = items.length > 0 ? items : FALLBACK_ITEMS;

  return (
    <section className="py-24 border-t border-[var(--border-subtle)] relative z-20" style={{ background: 'var(--bg-surface)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
                — Comunicados Cephalopod
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4 leading-tight">
              Pizarra de Novedades
              <span className="block text-[var(--color-primary)] font-semibold">
                & Curaduría Semanal
              </span>
            </h2>
            <p className="font-mono text-xs md:text-sm leading-relaxed text-[var(--text-secondary)] max-w-xl">
              Información clave para dueños que buscan dominar el caos.
              Tips, herramientas y alertas exclusivas para tu negocio.
            </p>
          </div>

          {/* Sistema status pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}>
            <span aria-hidden="true" className="inline-flex h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-primary)', boxShadow: '0 0 6px rgba(0,255,157,0.7)' }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-primary)]">
              Feed · Activo
            </span>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayItems.map((item, idx) => {
            const meta = getTypeMeta(item.type);
            const Icon = meta.icon;
            const num = String(idx + 1).padStart(2, '0');
            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group relative flex flex-col text-left p-5 border transition-all hover:bg-[var(--bg-surface-soft)]"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}
              >
                {/* Corner brackets */}
                <span aria-hidden="true" className="absolute top-0 left-0 w-2.5 h-2.5 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
                <span aria-hidden="true" className="absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

                {/* Top row: icon + tag */}
                <div className="flex items-start justify-between mb-5">
                  <span
                    className="flex items-center justify-center w-10 h-10 border transition-colors group-hover:border-[var(--color-primary)]"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--color-primary)' }}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </span>
                  {item.tag ? (
                    <span
                      className="font-mono text-[9px] uppercase tracking-[0.18em] px-2 py-1 border"
                      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
                    >
                      #{item.tag}
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      {num}
                    </span>
                  )}
                </div>

                {/* Type kicker */}
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-primary)] mb-3">
                  {meta.label}
                </span>

                {/* Title */}
                <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)] mb-3 group-hover:text-[var(--color-primary)] transition-colors leading-tight">
                  {item.title}
                </h3>

                {/* Summary */}
                <p className="font-mono text-xs leading-relaxed text-[var(--text-secondary)] mb-5 flex-grow line-clamp-4">
                  {item.summary}
                </p>

                {/* CTA */}
                {item.cta_label && item.cta_url && (
                  <div className="mt-auto pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-primary)]">
                      {item.cta_label}
                    </span>
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 border transition-colors group-hover:border-[var(--color-primary)] group-hover:text-[var(--color-primary)]"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 flex justify-center items-center gap-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
          <span className="h-px w-12" style={{ background: 'var(--border-strong)' }} />
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Actualizado · Enero 2026
          </span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span>CPD-HOM-NEWS-001</span>
          <span className="h-px w-12" style={{ background: 'var(--border-strong)' }} />
        </div>
      </div>

      {/* ============================================================
          MODAL — HUD frame
         ============================================================ */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 backdrop-blur-sm animate-fade-in"
            style={{ background: 'rgba(5, 6, 7, 0.85)' }}
            onClick={() => setSelectedItem(null)}
          />
          <div
            className="relative max-w-2xl w-full p-8 border animate-fade-in-up"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)', boxShadow: '0 0 60px rgba(0, 255, 157, 0.15)' }}
          >
            {/* Corner brackets */}
            <span aria-hidden="true" className="absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="absolute top-0 right-0 w-3 h-3 border-r border-t" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="absolute bottom-0 left-0 w-3 h-3 border-l border-b" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 inline-flex items-center justify-center w-8 h-8 border text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
              style={{ borderColor: 'var(--border-subtle)' }}
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center gap-4">
                <span
                  className="flex items-center justify-center w-12 h-12 border"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)', color: 'var(--color-primary)' }}
                >
                  {React.createElement(getTypeMeta(selectedItem.type).icon, { className: 'w-5 h-5', strokeWidth: 1.75 })}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-primary)] mb-1">
                    {getTypeMeta(selectedItem.type).label}
                  </div>
                  <h3 className="font-display text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                    {selectedItem.title}
                  </h3>
                </div>
              </div>

              {/* Body */}
              <div className="font-mono text-sm leading-relaxed text-[var(--text-secondary)] pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <p>{selectedItem.summary}</p>
              </div>

              {/* CTA */}
              {selectedItem.cta_label && selectedItem.cta_url && (
                <div className="pt-4 border-t flex justify-end" style={{ borderColor: 'var(--border-subtle)' }}>
                  <a
                    href={selectedItem.cta_url}
                    target={selectedItem.cta_url.startsWith('http') ? '_blank' : '_self'}
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.22em] font-semibold transition-colors hover:opacity-90"
                    style={{ background: 'var(--color-primary)', color: 'var(--text-on-phosphor)' }}
                  >
                    {selectedItem.cta_label}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default NewsBoard;
