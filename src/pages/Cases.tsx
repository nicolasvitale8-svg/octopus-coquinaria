import React from 'react';
import Layout from '../components/Layout';
import { CheckCircle, TrendingUp, ChevronLeft, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Cases.tsx — Página /cases · Casos de Éxito en estética HUD CEPHALOPOD.
 * Tokens phosphor, marcos rectos con brackets, doc-codes, font-mono+display.
 */

interface CaseData {
  id: string;
  name: string;
  tag: string;
  challengeTitle: string;
  challenge: string;
  actionsTitle: string;
  actions: string[];
  results: string[];
}

const cases: CaseData[] = [
  {
    id: 'CPD-CASE-001',
    name: 'Los Serranitos',
    tag: 'Reapertura & Ordenamiento',
    challengeTitle: 'El Desafío',
    challenge: 'Negocio con alta demanda esperada, pero sin estructura operativa sólida, sin procesos formales ni criterios de control.',
    actionsTitle: 'Intervención Cephalopod',
    actions: [
      'Diseño de flujo operativo y organización de sectores.',
      'Diseño de carta completa y selección de proveedores.',
      'Checklists de apertura, cierre y limpieza.',
      'Implementación de sistema Mr. Comanda.',
      'Control de compras y costos mensual.'
    ],
    results: [
      'Operación ordenada y sostenible bajo alta demanda.',
      'Equipo capacitado y rotación reducida.',
      'Carta rentable y sistema de control funcionando.'
    ]
  },
  {
    id: 'CPD-CASE-002',
    name: 'COLIFA',
    tag: 'Concepto, Carta & Procesos',
    challengeTitle: 'El Desafío',
    challenge: 'Falta de identidad consistente en carta y procesos de salón sin estandarizar, dificultando la escalabilidad del concepto.',
    actionsTitle: 'Intervención Cephalopod',
    actions: [
      'Diseño integral de carta (identidad y rentabilidad).',
      'Creación de fichas técnicas completas.',
      'Capacitación de salón: secuencia de servicio.',
      'Diseño de carta digital y física.',
      'Videos de capacitación para procesos.'
    ],
    results: [
      'Carta consistente alineada al concepto.',
      'Equipo de salón con secuencia profesional.',
      'Activos digitales listos para escalar.'
    ]
  },
  {
    id: 'CPD-CASE-003',
    name: 'Cerdo Va!',
    tag: 'Producto & Sistema de Costos',
    challengeTitle: 'El Desafío',
    challenge: 'Margen comprometido por falta de control de costos y necesidad de estandarizar producto centrado en cerdo.',
    actionsTitle: 'Intervención Cephalopod',
    actions: [
      'Diseño de productos centrados en cerdo.',
      'Fichas técnicas (recetas, costos, controles).',
      'Capacitación en inocuidad y BPM.',
      'Desarrollo de "Cerdo Va! Ops" (mini web de gestión).'
    ],
    results: [
      'Productos consistentes y controlados.',
      'Margen saludable por control estricto de costos.',
      'Herramienta digital propia para gestión.'
    ]
  }
];

const Cases = () => {
  return (
    <Layout>
      <div style={{ background: 'var(--bg-base)' }} className="min-h-screen pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Volver */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 group"
              style={{ color: 'var(--text-muted)' }}
            >
              <div
                className="p-1.5 border transition-all"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] group-hover:text-[var(--color-primary)] transition-colors">
                Volver al Inicio
              </span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="font-mono text-[10px] uppercase tracking-[0.32em] mb-3" style={{ color: 'var(--color-primary)' }}>
              — CPD-PUB-CASES-001
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
              Casos de <span style={{ color: 'var(--color-primary)' }}>Éxito</span>
            </h1>
            <p className="font-mono text-sm md:text-base max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Resultados medibles aplicando metodología 7P sobre operaciones reales.
            </p>
          </div>

          {/* Casos */}
          <div className="space-y-10">
            {cases.map((caseItem) => (
              <article
                key={caseItem.id}
                className="relative border overflow-hidden transition-all"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
                <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

                <div className="p-8 md:p-10">
                  {/* Encabezado caso */}
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8 pb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-2" style={{ color: 'var(--text-muted)' }}>
                        — {caseItem.id}
                      </div>
                      <h2 className="font-display text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                        {caseItem.name}
                      </h2>
                      <span
                        className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.22em] px-2 py-1 border"
                        style={{
                          background: 'var(--bg-base)',
                          color: 'var(--color-primary)',
                          borderColor: 'var(--color-primary)'
                        }}
                      >
                        {caseItem.tag}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
                      <Award className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} strokeWidth={1.75} />
                      Caso {caseItem.id.split('-').pop()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Desafío + Acciones */}
                    <div>
                      <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--text-muted)' }}>
                        // {caseItem.challengeTitle}
                      </h3>
                      <p className="font-mono text-[12px] leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                        {caseItem.challenge}
                      </p>

                      <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--text-muted)' }}>
                        // {caseItem.actionsTitle}
                      </h3>
                      <ul className="space-y-2">
                        {caseItem.actions.map((item, i) => (
                          <li key={i} className="flex items-start font-mono text-[12px]" style={{ color: 'var(--text-primary)' }}>
                            <CheckCircle className="w-3.5 h-3.5 mr-2 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
                            <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Resultados */}
                    <div
                      className="relative p-6 border"
                      style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                    >
                      <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-2 h-2 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
                      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

                      <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-2" style={{ color: 'var(--text-muted)' }}>
                        — Resultados
                      </div>
                      <h4 className="font-display text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                        <TrendingUp className="w-5 h-5 mr-2" style={{ color: 'var(--color-primary)' }} strokeWidth={1.75} />
                        Outcome medible
                      </h4>
                      <ul className="space-y-3">
                        {caseItem.results.map((result, i) => (
                          <li key={i} className="flex items-start font-mono text-[12px]" style={{ color: 'var(--text-primary)' }}>
                            <span
                              className="font-mono font-bold mr-2 flex-shrink-0"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              {String(i + 1).padStart(2, '0')}.
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>{result}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* CTA → Servicios */}
          <div
            className="relative mt-16 p-8 md:p-10 border text-center"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="pointer-events-none absolute top-0 right-0 w-3 h-3 border-r border-t" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 w-3 h-3 border-l border-b" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

            <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-2" style={{ color: 'var(--color-primary)' }}>
              — ¿Tu negocio en este listado?
            </div>
            <h3 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Conocé los servicios que hacen posible cada caso
            </h3>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.28em] px-4 py-2 border transition-colors"
              style={{
                background: 'var(--color-primary)',
                color: '#050607',
                borderColor: 'var(--color-primary)'
              }}
            >
              › Ver Servicios Cephalopod
            </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Cases;
