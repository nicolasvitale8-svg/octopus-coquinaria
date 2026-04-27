import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import OctopusMark from '../components/ui/OctopusMark';
import OctopusLoader from '../components/ui/OctopusLoader';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import {
  METHODOLOGY_7P,
  WHATSAPP_NUMBER,
  INSTAGRAM_URL,
  YOUTUBE_URL,
  BRAND_ILLUSTRATION_URL,
} from '../constants';
import {
  ArrowRight,
  Video,
  MessageCircle,
  AlertTriangle,
  Instagram,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  Zap,
  FileText,
  Play,
  LayoutTemplate,
  ClipboardList,
  GraduationCap,
  Settings,
  Calculator,
  Users,
  LayoutGrid,
  GitBranch,
  Sparkles,
  Cpu,
  LucideIcon,
} from 'lucide-react';
import TickerGastronomico from '../components/TickerGastronomico';
import NewsBoard from '../components/NewsBoard';
import { getResources } from '../services/academyService';
import { AcademyResource } from '../types';

/**
 * Home — Landing testigo del rebrand Octopus Coquinaria.
 *
 * Cambios visuales (vs versión anterior):
 *   - Tipografía hero: Sora display (font-display) en lugar de Space Grotesk.
 *   - Paleta: navy + cream + gold como primario; cyan-tech queda accent.
 *   - Hero h1 reemplaza "Tu restaurante no necesita más ideas..." por el
 *     claim oficial "Sistemas que piensan. Operaciones que responden."
 *   - Eyebrow superior: "Octopus Coquinaria · Sistemas operativos para gastronomía".
 *   - Doc-code OCT-LAND-HERO-001 visible en mono como detalle técnico.
 *   - Iconografía 7P: lucide-react lineal (NO emojis 3D), mapeo posicional.
 *   - Loader de academia → OctopusLoader. Empty academy → EmptyState.
 *   - Métricas Caos/Octopus mantienen el toggle, ahora gold para OK / danger
 *     token para caos (no rojo hardcodeado).
 *   - Eliminado el SVG fallback del pulpo grueso de la versión anterior.
 *     Si BRAND_ILLUSTRATION_URL falla, usamos OctopusMark duotone como respaldo.
 */

// Mapeo posicional 7P → lucide. Reemplaza los emojis 3D del legacy.
const PILLAR_ICONS: LucideIcon[] = [
  Settings,    // Operaciones
  Calculator,  // Costos
  Users,       // Talento
  LayoutGrid,  // Organización
  GitBranch,   // Procesos
  Sparkles,    // Unidad / Experiencia
  Cpu,         // Sistemas
];

const Home = () => {
  const [imgError, setImgError] = useState(false);
  const [isOctopusMode, setIsOctopusMode] = useState(true);
  const [featuredResources, setFeaturedResources] = useState<AcademyResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const all = await getResources();
        const filtered = all
          .filter((r) => r.access === 'PUBLIC' || r.access === 'FREE')
          .slice(0, 3);
        setFeaturedResources(filtered);
      } catch (e) {
        console.error('Error loading home resources', e);
      } finally {
        setLoadingResources(false);
      }
    };
    loadResources();
  }, []);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1 },
    );
    document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const getResourceIcon = (format: string) => {
    switch (format) {
      case 'VIDEO':
        return <Play size={16} />;
      case 'TEMPLATE':
        return <LayoutTemplate size={16} />;
      case 'TIP':
        return <Zap size={16} />;
      case 'FORM':
        return <ClipboardList size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <Layout>
      {/* ============================================================
          HERO
          OCT-LAND-HERO-001
         ============================================================ */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center bg-[var(--bg-base)]">
        {/* Subtle grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* DESKTOP HERO ILLUSTRATION */}
        <div className="hidden lg:block absolute top-1/2 right-0 -translate-y-1/2 h-[95vh] w-[50vw] translate-x-12 z-10 pointer-events-none">
          {/* Glow gold detrás */}
          <div className="absolute top-1/2 left-[60%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full blur-[80px] -z-10 animate-pulse"
               style={{ background: 'rgba(212, 182, 129, 0.18)' }} />
          {BRAND_ILLUSTRATION_URL && !imgError ? (
            <img
              src={BRAND_ILLUSTRATION_URL}
              alt="Octopus Coquinaria — ilustración editorial"
              className="w-full h-full object-contain object-right drop-shadow-2xl"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-end pr-10">
              <OctopusMark variant="duotone" className="h-[70%] w-auto" animated />
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
            {/* Texto + CTA */}
            <div className="text-left order-2 lg:order-1 relative z-20 max-w-2xl">
              {/* Social row */}
              <div className="flex gap-3 mb-8">
                <a
                  href={YOUTUBE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2 rounded-full"
                  title="YouTube"
                >
                  <Video className="w-4 h-4" />
                </a>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2 rounded-full"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2 rounded-full"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>

              {/* Eyebrow / wordmark */}
              <div className="mb-4 flex items-center gap-3">
                <OctopusMark variant="mono" size={28} className="text-[var(--color-primary)]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                  Octopus Coquinaria · Sistemas operativos para gastronomía
                </span>
              </div>

              {/* H1 — claim oficial */}
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-8 leading-[1.05] text-[var(--text-primary)]">
                Sistemas que piensan.
                <br />
                <span className="text-gradient-gold">Operaciones que responden.</span>
              </h1>

              {/* Sub copy — mantiene el flicker icónico */}
              <p className="font-sans text-lg md:text-xl text-[var(--text-secondary)] mb-10 max-w-xl leading-relaxed">
                <span className="animate-faulty-flicker inline-block font-semibold mr-1" style={{ color: 'var(--color-danger)' }}>
                  Si tu Excel da miedo
                </span>
                , estás en el lugar correcto. Procesos, datos, documentación y
                control convertidos en{' '}
                <span className="animate-shine font-semibold text-[var(--text-primary)]">sistema</span>.
                Para restaurantes, hoteles, frigoríficos, catering y comedores institucionales.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/quick-diagnostic">
                  <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right" fullWidth>
                    Diagnóstico operativo (5 min)
                  </Button>
                </Link>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  className="sm:w-auto"
                >
                  <Button variant="secondary" size="lg" icon={MessageCircle} fullWidth>
                    Hablar por WhatsApp
                  </Button>
                </a>
              </div>

              {/* Doc-code de pie */}
              <div className="mt-10 flex items-center gap-2 opacity-60">
                <span className="h-px w-8 bg-[var(--border-strong)]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  OCT-LAND-HERO-001
                </span>
              </div>
            </div>

            {/* MOBILE-only illustration */}
            <div className="order-1 lg:hidden flex justify-center items-center relative mb-2">
              <div className="w-[70%] max-w-[360px]">
                {BRAND_ILLUSTRATION_URL && !imgError ? (
                  <img
                    src={BRAND_ILLUSTRATION_URL}
                    alt="Octopus Coquinaria"
                    className="w-full h-auto drop-shadow-2xl"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <OctopusMark variant="duotone" className="w-full h-auto" />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER GASTRONÓMICO */}
      <TickerGastronomico />

      {/* ============================================================
          7 PILARES OCTOPUS — OCT-LAND-7P-001
         ============================================================ */}
      <section className="py-24 border-t border-[var(--border-subtle)] relative z-20" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal-on-scroll">
            <div className="mb-4 inline-flex items-center gap-2">
              <span className="h-px w-8 bg-[var(--color-primary)]" />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-primary)]">
                Método 7P
              </span>
              <span className="h-px w-8 bg-[var(--color-primary)]" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-[var(--text-primary)]">
              Los 7 Pilares <span className="text-gradient-gold">OCTOPUS</span>
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              Marco operativo único para ordenar gastronomía profesional —
              desde un foodtruck hasta una planta de catering hospitalario.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 reveal-on-scroll">
            {METHODOLOGY_7P.map((item, idx) => {
              const Icon = PILLAR_ICONS[idx % PILLAR_ICONS.length];
              return (
                <div
                  key={item.id}
                  className="group p-6 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--color-primary)] transition-all shadow-sm"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-[var(--border-subtle)] group-hover:border-[var(--color-primary)]"
                          style={{ background: 'var(--bg-surface-soft)', color: 'var(--color-primary)' }}>
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                      {item.letter}
                    </h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-4 italic min-h-[40px]">
                    "{item.tagline}"
                  </p>
                  <div className="mb-4">
                    <StatusBadge tone="danger" variant="soft" size="sm">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{item.symptoms[0]}</span>
                    </StatusBadge>
                  </div>
                  <Link
                    to="/methodology"
                    className="text-[var(--color-primary)] text-xs font-semibold hover:text-[var(--color-primary-soft)] inline-flex items-center gap-1 uppercase tracking-wide"
                  >
                    Ver cómo lo trabajamos
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* NEWS BOARD */}
      <NewsBoard />

      {/* ============================================================
          BENEFITS — Toggle Caos/Octopus — OCT-LAND-IMP-001
         ============================================================ */}
      <section
        className={`py-20 border-t transition-all duration-1000 relative overflow-hidden z-20 ${
          isOctopusMode ? '' : ''
        }`}
        style={{
          background: isOctopusMode ? 'var(--bg-base)' : '#0a0303',
          borderColor: isOctopusMode ? 'var(--border-subtle)' : 'rgba(239, 68, 68, 0.18)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Selector de modo */}
          <div className="flex flex-col items-center mb-16">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.28em] mb-6 text-[var(--text-muted)]">
              Visualizador de Impacto Octopus
            </h3>
            <div
              className="flex items-center gap-2 p-1.5 rounded-full border backdrop-blur-md shadow-2xl"
              style={{
                background: 'rgba(0,0,0,0.4)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <button
                onClick={() => setIsOctopusMode(false)}
                className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-500 ${
                  !isOctopusMode
                    ? 'shadow-[0_0_20px_rgba(239,68,68,0.45)]'
                    : ''
                }`}
                style={
                  !isOctopusMode
                    ? { background: 'var(--color-danger)', color: '#fff' }
                    : { color: 'var(--text-muted)' }
                }
              >
                Operación Caos
              </button>
              <button
                onClick={() => setIsOctopusMode(true)}
                className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-500 ${
                  isOctopusMode
                    ? 'shadow-[0_0_20px_var(--glow-primary)]'
                    : ''
                }`}
                style={
                  isOctopusMode
                    ? { background: 'var(--color-primary)', color: 'var(--text-on-gold)' }
                    : { color: 'var(--text-muted)' }
                }
              >
                Método Octopus
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center items-start">
            {/* Metric 1 */}
            <div className="transition-all duration-700">
              <div
                className={`font-mono font-black mb-4 transition-all duration-700 ${
                  isOctopusMode ? 'text-6xl' : 'text-5xl italic translate-y-2'
                }`}
                style={{ color: isOctopusMode ? 'var(--text-primary)' : 'rgba(239,68,68,0.85)' }}
              >
                {isOctopusMode ? '–7 pts' : '+38%'}
              </div>
              <div
                className="flex items-center justify-center gap-2 mb-4 transition-colors duration-700"
                style={{ color: isOctopusMode ? 'var(--color-primary)' : 'var(--color-danger)' }}
              >
                {isOctopusMode ? <TrendingDown size={20} /> : <Activity size={20} className="animate-pulse" />}
                <span className="font-bold uppercase tracking-widest text-[10px]">
                  {isOctopusMode ? 'Costo Mercadería' : 'Fugas de Stock'}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {isOctopusMode
                  ? 'Reducción directa al implementar ingeniería de menú y control de compras.'
                  : 'Pérdidas constantes por falta de procesos y recetas estandarizadas.'}
              </p>
            </div>

            {/* Metric 2 */}
            <div className="transition-all duration-700 md:border-l md:border-r" style={{ borderColor: 'var(--border-subtle)' }}>
              <div
                className={`font-mono font-black mb-4 transition-all duration-700 ${
                  isOctopusMode ? 'text-6xl' : 'text-5xl italic translate-y-2'
                }`}
                style={{ color: isOctopusMode ? 'var(--text-primary)' : 'rgba(239,68,68,0.85)' }}
              >
                {isOctopusMode ? '+18%' : 'Estancado'}
              </div>
              <div
                className="flex items-center justify-center gap-2 mb-4 transition-colors duration-700"
                style={{ color: isOctopusMode ? 'var(--color-primary)' : 'var(--color-danger)' }}
              >
                {isOctopusMode ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                <span className="font-bold uppercase tracking-widest text-[10px]">
                  {isOctopusMode ? 'Venta x Cubierto' : 'Ticket Promedio'}
                </span>
              </div>
              <p className="text-xs leading-relaxed px-4" style={{ color: 'var(--text-secondary)' }}>
                {isOctopusMode
                  ? 'Incremento logrado mediante capacitación de salón y arquitectura web.'
                  : 'Sin estrategia de up-selling ni optimización de rotación de mesas.'}
              </p>
            </div>

            {/* Metric 3 */}
            <div className="transition-all duration-700">
              <div
                className={`font-mono font-black mb-4 transition-all duration-700 ${
                  isOctopusMode ? 'text-6xl' : 'text-5xl italic translate-y-2'
                }`}
                style={{ color: isOctopusMode ? 'var(--text-primary)' : 'rgba(239,68,68,0.85)' }}
              >
                {isOctopusMode ? '0' : 'Incierto'}
              </div>
              <div
                className="flex items-center justify-center gap-2 mb-4 transition-colors duration-700"
                style={{ color: isOctopusMode ? 'var(--color-primary)' : 'var(--color-danger)' }}
              >
                {isOctopusMode ? <ShieldCheck size={20} /> : <AlertTriangle size={20} className="animate-bounce" />}
                <span className="font-bold uppercase tracking-widest text-[10px]">
                  {isOctopusMode ? 'Errores Operativos' : 'Caos Diario'}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {isOctopusMode
                  ? 'Continuidad operativa garantizada. Dueños con tiempo libre real.'
                  : 'Compras reactivas de último momento que matan el margen neto.'}
              </p>
            </div>
          </div>

          {/* CTA Card final */}
          <div className="mt-16 text-center relative max-w-4xl mx-auto">
            <div
              className="absolute inset-0 blur-3xl rounded-full transition-opacity duration-1000"
              style={{
                background: 'var(--glow-primary)',
                opacity: isOctopusMode ? 1 : 0,
              }}
            />
            <div
              className="relative z-10 p-10 md:p-14 rounded-3xl border transition-all duration-1000"
              style={
                isOctopusMode
                  ? {
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border-strong)',
                      boxShadow: '0 0 50px var(--glow-primary)',
                    }
                  : {
                      background: 'rgba(0,0,0,0.5)',
                      borderColor: 'rgba(239,68,68,0.18)',
                      filter: 'grayscale(0.6)',
                    }
              }
            >
              <h3 className="font-display text-3xl md:text-4xl font-semibold mb-8 text-[var(--text-primary)] tracking-tight">
                {isOctopusMode
                  ? '¿Querés saber dónde estás parado?'
                  : '¿Hasta cuándo vas a trabajar así?'}
              </h3>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/quick-diagnostic">
                  <Button
                    variant={isOctopusMode ? 'primary' : 'danger'}
                    size="lg"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    {isOctopusMode ? 'Comenzar autodiagnóstico' : 'Detectar mis fugas hoy'}
                  </Button>
                </Link>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Me%20gustar%C3%ADa%20agendar%20una%20videollamada%20para%20mi%20negocio`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="outline" size="lg" icon={MessageCircle}>
                    Agendar videollamada
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          BIBLIOTECA GRATUITA — OCT-LAND-ACAD-001
         ============================================================ */}
      <section className="py-20 border-t border-[var(--border-subtle)] relative" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-7xl mx-auto px-6 reveal-on-scroll">
          <div className="flex flex-col md:flex-row justify-between items-end mb-14 gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-12 bg-[var(--color-primary)]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--color-primary)]">
                  Biblioteca Gratuita
                </span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-semibold text-[var(--text-primary)] mb-6 leading-tight tracking-tight">
                Recursos para
                <br />
                <span className="text-gradient-gold italic font-light">empezar hoy</span>
              </h2>
              <p className="text-[var(--text-secondary)] text-base md:text-lg leading-relaxed">
                Herramientas y guías prácticas de la metodología Octopus que
                podés aplicar ahora mismo en tu negocio sin costo.
              </p>
            </div>
            <Link to="/academy" className="mb-2">
              <Button variant="outline" size="lg" icon={ArrowRight} iconPosition="right">
                Explorar Academia
              </Button>
            </Link>
          </div>

          {loadingResources ? (
            <OctopusLoader variant="card-skeleton" cards={3} />
          ) : featuredResources.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Aún no hay recursos públicos"
              body="Estamos preparando los primeros recursos abiertos de la academia. Mientras tanto, podés escribirnos por WhatsApp."
              cta={{ label: 'Ir a Academia', href: '/academy' }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredResources.map((res) => (
                <article
                  key={res.id}
                  className="group relative flex flex-col h-full rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {/* Glow */}
                  <div
                    className="absolute -right-20 -top-20 w-40 h-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'var(--glow-primary)' }}
                  />

                  <div className="mb-6">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-[var(--border-subtle)]"
                      style={{
                        background: 'var(--bg-surface-soft)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      <GraduationCap className="w-6 h-6" strokeWidth={1.75} />
                    </div>
                  </div>

                  <div className="flex-grow space-y-3 mb-8">
                    <div className="flex items-center gap-2">
                      <StatusBadge tone="cyan" variant="outline" size="sm">
                        {getResourceIcon(res.format)}
                        <span>{res.format}</span>
                      </StatusBadge>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {res.category}
                      </span>
                    </div>
                    <h3 className="font-display text-xl md:text-2xl font-semibold text-[var(--text-primary)] leading-tight group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                      {res.title}
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed line-clamp-3">
                      {res.outcome}
                    </p>
                  </div>

                  <div className="pt-6 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      Open Resource
                    </span>
                    <Link
                      to={`/academy/${res.id}`}
                      className="text-[var(--color-primary)] text-xs font-semibold uppercase tracking-widest hover:text-[var(--color-primary-soft)] flex items-center gap-2"
                    >
                      Comenzar
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Home;
