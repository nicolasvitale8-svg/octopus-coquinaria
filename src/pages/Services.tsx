import React from 'react';
import Layout from '../components/Layout';
import { WHATSAPP_NUMBER, COLIFA_MENU_URL, TECHNICAL_SHEETS_EXAMPLE_URL, PROCESS_EXAMPLE_URL } from '../constants';
import Button from '../components/ui/Button';
import {
  ArrowRight, Star, TrendingUp, Settings, BarChart2, Users, Layers, Zap,
  ExternalLink, FileText, ChevronLeft, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Services.tsx — Página /services · Servicios y Activos Digitales en HUD CEPHALOPOD.
 * Tokens phosphor, marcos rectos con brackets, doc-codes, font-mono+display.
 * Casos de Éxito se movieron a /cases (página separada).
 */

interface ServiceData {
  code: string;
  icon: React.ReactNode;
  title: string;
  problem: string;
  items: string[];
}

const services: ServiceData[] = [
  {
    code: 'CPD-SVC-001',
    icon: <BarChart2 className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Control y Números',
    problem: 'No sé si gano o pierdo.',
    items: ['Estado de Resultado.', 'Control CMV y Mano de obra.', 'Tableros y reportes.']
  },
  {
    code: 'CPD-SVC-002',
    icon: <Settings className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Orden y Procesos',
    problem: 'Alto estrés y errores.',
    items: ['Diseño de procesos.', 'Checklists operativos.', 'Capacitación en Orden.']
  },
  {
    code: 'CPD-SVC-003',
    icon: <Star className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Diseño de Carta',
    problem: 'Carta poco rentable.',
    items: ['Ingeniería de menú.', 'Fichas técnicas.', 'Análisis de rentabilidad.']
  },
  {
    code: 'CPD-SVC-004',
    icon: <Zap className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Tecnología',
    problem: 'Datos dispersos.',
    items: ['Planillas inteligentes.', 'Integración sistemas.', 'Asistentes IA.']
  },
  {
    code: 'CPD-SVC-005',
    icon: <Users className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Capacitación',
    problem: 'Equipo sin técnica.',
    items: ['Entrenamiento cocina.', 'Secuencia de servicio.', 'Auditorías.']
  },
  {
    code: 'CPD-SVC-006',
    icon: <TrendingUp className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Acompañamiento',
    problem: 'Aperturas o crisis.',
    items: ['Modelo operativo.', 'Puesta en marcha.', 'Soporte presencial.']
  }
];

const Services = () => {
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
              — CPD-PUB-SVC-001
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
              Servicios <span style={{ color: 'var(--color-primary)' }}>Cephalopod</span>
            </h1>
            <p className="font-mono text-sm md:text-base max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Soluciones operativas con metodología 7P aplicadas a tu modelo de negocio.
            </p>
          </div>

          {/* SECCIÓN: GRILLA DE SERVICIOS */}
          <div className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.code}
                  className="relative border p-6 transition-all group cursor-default"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
                  <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

                  {/* Doc-code */}
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-4" style={{ color: 'var(--text-muted)' }}>
                    — {service.code}
                  </div>

                  {/* Ícono cuadrado bordeado */}
                  <div
                    className="w-12 h-12 border flex items-center justify-center mb-5 transition-colors group-hover:border-[var(--color-primary)]"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)', color: 'var(--color-primary)' }}
                  >
                    {service.icon}
                  </div>

                  <h3 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {service.title}
                  </h3>

                  {/* Pain point */}
                  <div
                    className="font-mono text-[11px] italic mb-4 p-2 border-l-2"
                    style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  >
                    "{service.problem}"
                  </div>

                  <ul className="space-y-1.5">
                    {service.items.map((it, i) => (
                      <li key={i} className="flex items-start font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        <span className="mr-2 flex-shrink-0" style={{ color: 'var(--color-primary)' }}>›</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* CTA WhatsApp */}
            <div className="mt-12 text-center">
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
                <Button variant="primary" size="lg" icon={ArrowRight}>
                  Consultar por un servicio
                </Button>
              </a>
            </div>
          </div>

          {/* SECCIÓN: ACTIVOS DIGITALES */}
          <div
            className="relative border p-8"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="pointer-events-none absolute top-0 right-0 w-3 h-3 border-r border-t" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 w-3 h-3 border-l border-b" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-2" style={{ color: 'var(--color-primary)' }}>
                  — CPD-PUB-SVC-ASSETS-001
                </div>
                <h3 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Activos Digitales Disponibles
                </h3>
                <p className="font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  Ejemplos reales de herramientas que implementamos en clientes.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href={COLIFA_MENU_URL || '#'} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm" icon={ExternalLink}>
                    Carta Digital COLIFA
                  </Button>
                </a>

                <a href={TECHNICAL_SHEETS_EXAMPLE_URL || '#'} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm" icon={FileText}>
                    Ejemplo Ficha Técnica
                  </Button>
                </a>

                <a href={PROCESS_EXAMPLE_URL || '#'} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm" icon={Layers}>
                    Ejemplo Procesos
                  </Button>
                </a>

                <Button variant="secondary" size="sm" icon={ExternalLink}>
                  Cerdo Va! Ops
                </Button>
              </div>
            </div>
          </div>

          {/* CTA → Casos */}
          <div className="mt-12 text-center">
            <Link
              to="/cases"
              className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.28em] transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <Award className="w-4 h-4" style={{ color: 'var(--color-primary)' }} strokeWidth={1.75} />
              <span className="hover:text-[var(--color-primary)] transition-colors">
                › Ver Casos de Éxito
              </span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Services;
