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
 * Home — Landing testigo del rebrand Cephalopod.
 *
 * Cambios visuales (vs versión anterior):
 *   - Tipografía hero: Sora display (font-display) en lugar de Space Grotesk.
 *   - Paleta: navy + cream + gold como primario; cyan-tech queda accent.
 *   - Hero h1 reemplaza "Tu restaurante no necesita más ideas..." por el
 *     claim oficial "Sistemas que piensan. Operaciones que responden."
 *   - Eyebrow superior: "Cephalopod · Sistemas operativos para gastronomía".
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
        {/* HUD grid backdrop — más fuerte que opacity 0.04 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Corner reticles — HUD aesthetic */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          {/* TL */}
          <div className="absolute top-4 left-4 w-6 h-6 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
          {/* TR */}
          <div className="absolute top-4 right-4 w-6 h-6 border-r border-t" style={{ borderColor: 'var(--color-primary)' }} />
          {/* BL */}
          <div className="absolute bottom-4 left-4 w-6 h-6 border-l border-b" style={{ borderColor: 'var(--color-primary)' }} />
          {/* BR */}
          <div className="absolute bottom-4 right-4 w-6 h-6 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />
        </div>

        {/* DESKTOP — RADAR HUD + CEPHALOPOD */}
        <div className="hidden lg:block absolute top-1/2 right-0 -translate-y-1/2 h-[80vh] w-[48vw] z-10 pointer-events-none">
          {/* Glow phosphor */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] rounded-full blur-[100px]"
               style={{ background: 'rgba(0, 255, 157, 0.14)' }} />

          <div className="relative w-full h-full flex items-center justify-center">
            {/* Radar SVG */}
            <svg viewBox="0 0 600 600" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#00FF9D" stopOpacity="0" />
                  <stop offset="100%" stopColor="#00FF9D" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              {/* Radar concentric circles */}
              <g fill="none" stroke="#00FF9D" strokeOpacity="0.25" strokeWidth="0.8">
                <circle cx="300" cy="300" r="270" />
                <circle cx="300" cy="300" r="210" />
                <circle cx="300" cy="300" r="150" />
                <circle cx="300" cy="300" r="90" />
                <circle cx="300" cy="300" r="30" />
              </g>

              {/* Crosshairs */}
              <g stroke="#00FF9D" strokeOpacity="0.18" strokeWidth="0.6" strokeDasharray="3 4">
                <line x1="20" y1="300" x2="580" y2="300" />
                <line x1="300" y1="20" x2="300" y2="580" />
              </g>

              {/* Tick marks at cardinal points */}
              <g stroke="#00FF9D" strokeOpacity="0.6" strokeWidth="1.5">
                <line x1="300" y1="20" x2="300" y2="36" />
                <line x1="300" y1="564" x2="300" y2="580" />
                <line x1="20" y1="300" x2="36" y2="300" />
                <line x1="564" y1="300" x2="580" y2="300" />
              </g>

              {/* Mono labels */}
              <g fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#00FF9D" fillOpacity="0.55" letterSpacing="2">
                <text x="300" y="14" textAnchor="middle">N</text>
                <text x="300" y="595" textAnchor="middle">S</text>
                <text x="14"  y="304" textAnchor="middle">W</text>
                <text x="586" y="304" textAnchor="middle">E</text>
                <text x="34"  y="40"  textAnchor="start">CORE_ID 7P-OP-01</text>
                <text x="566" y="40"  textAnchor="end">VER 2.0</text>
                <text x="34"  y="572" textAnchor="start">RANGE 270</text>
                <text x="566" y="572" textAnchor="end">SCAN ON</text>
              </g>

              {/* Radar sweep — rotating wedge */}
              <g className="animate-radar-sweep" style={{ transformOrigin: '300px 300px' }}>
                <path d="M 300 300 L 570 300 A 270 270 0 0 1 528 462 Z" fill="url(#radarSweep)" />
                <line x1="300" y1="300" x2="570" y2="300" stroke="#00FF9D" strokeOpacity="0.85" strokeWidth="1.2" />
              </g>

              {/* Data points (random "blips") */}
              <g fill="#00FF9D">
                <circle cx="380" cy="220" r="3" opacity="0.85"/>
                <circle cx="240" cy="180" r="2" opacity="0.55"/>
                <circle cx="430" cy="380" r="3.5" opacity="0.9"/>
                <circle cx="195" cy="395" r="2.5" opacity="0.5"/>
                <circle cx="350" cy="470" r="2" opacity="0.6"/>
              </g>
            </svg>

            {/* Cephalopod centered, on top of the radar */}
            <div className="relative z-10 w-[55%] max-w-[340px]">
              <OctopusMark variant="phosphor" animated />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
            {/* Texto + CTA */}
            <div className="text-left order-2 lg:order-1 relative z-20 max-w-2xl">
              {/* SISTEMA: ONLINE indicator + social row */}
              <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 border" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(0, 255, 157, 0.04)' }}>
                  <span className="inline-flex h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-primary)', boxShadow: '0 0 6px rgba(0,255,157,0.7)' }} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-primary)]">
                    Sistema: online
                  </span>
                </div>

                <div className="flex gap-2">
                  <a
                    href={YOUTUBE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors p-2 border"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
                    title="YouTube"
                  >
                    <Video className="w-4 h-4" />
                  </a>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors p-2 border"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors p-2 border"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Eyebrow / wordmark */}
              <div className="mb-4 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="inline-block h-px w-8"
                  style={{ background: 'var(--color-primary)' }}
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-secondary)]">
                  Inteligencia operativa para gastronomía
                </span>
              </div>

              {/* H1 — claim oficial CEPHALOPOD */}
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.05] text-[var(--text-primary)]" style={{ textShadow: '0 0 24px rgba(0, 255, 157, 0.15)' }}>
                Sistemas que
                <br />
                <span className="text-[var(--color-primary)]" style={{ textShadow: '0 0 32px rgba(0, 255, 157, 0.45)' }}>piensan.</span>
              </h1>

              {/* Sub copy */}
              <p className="font-sans text-lg md:text-xl text-[var(--text-secondary)] mb-3 max-w-xl leading-relaxed">
                Transformamos procesos, datos y documentación gastronómica en
                control y criterio operativo.
              </p>
              <p className="font-mono text-xs md:text-sm uppercase tracking-[0.18em] text-[var(--text-muted)] mb-10">
                Menos improvisación · más sistema. Decisiones con respaldo. Resultados que se miden.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/quick-diagnostic">
                  <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right" fullWidth>
                    Solicitar diagnóstico
                  </Button>
                </Link>
                <Link to="/finance" className="sm:w-auto">
                  <Button variant="outline" size="lg" fullWidth>
                    Ver sistema
                  </Button>
                </Link>
              </div>

              {/* Método 7P — link prominente */}
              <Link
                to="/methodology"
                className="inline-flex items-center gap-2 mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
              >
                <span className="inline-flex items-center justify-center w-4 h-4 border" style={{ borderColor: 'var(--border-subtle)' }}>+</span>
                Método Octopus 7P
              </Link>

              {/* Doc-code de pie */}
              <div className="mt-10 flex items-center gap-2 opacity-60">
                <span className="h-px w-8 bg-[var(--border-strong)]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  CPD-HOM-HUD-001
                </span>
              </div>
            </div>

            {/* MOBILE-only illustration: cephalopod phosphor sobre radar simple */}
            <div className="order-1 lg:hidden flex justify-center items-center relative mb-2">
              <div className="w-[70%] max-w-[280px] relative aspect-square">
                {/* Glow phosphor */}
                <div className="absolute inset-0 rounded-full blur-[60px]" style={{ background: 'rgba(0, 255, 157, 0.15)' }} />
                {/* Radar circles */}
                <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full">
                  <g fill="none" stroke="#00FF9D" strokeOpacity="0.22" strokeWidth="0.6">
                    <circle cx="150" cy="150" r="135"/>
                    <circle cx="150" cy="150" r="100"/>
                    <circle cx="150" cy="150" r="65"/>
                    <circle cx="150" cy="150" r="30"/>
                  </g>
                  <g stroke="#00FF9D" strokeOpacity="0.14" strokeWidth="0.5" strokeDasharray="3 3">
                    <line x1="15" y1="150" x2="285" y2="150"/>
                    <line x1="150" y1="15" x2="150" y2="285"/>
                  </g>
                </svg>
                {/* Cephalopod centered */}
                <div className="absolute inset-[18%]">
                  <OctopusMark variant="phosphor" animated />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER GASTRONÓMICO */}
      <TickerGastronomico />

      {/* ============================================================
          SERVICIOS — CPD-HOM-SVC-001
         ============================================================ */}
      <section className="py-24 border-t border-[var(--border-subtle)] relative z-20" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="flex items-center justify-between mb-12 reveal-on-scroll">
            <div className="inline-flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">— Servicios</span>
            </div>
            <Link to="/services" className="hidden md:inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors">
              Ver todos los servicios
              <span className="inline-flex items-center justify-center w-4 h-4 border" style={{ borderColor: 'var(--border-subtle)' }}>+</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 reveal-on-scroll">
            {[
              {
                icon: ShieldCheck,
                title: 'Diagnóstico Operativo',
                desc: 'Análisis profundo de procesos, datos y operaciones para detectar brechas, riesgos y oportunidades.',
                href: '/quick-diagnostic',
              },
              {
                icon: FileText,
                title: 'Sistema Documental',
                desc: 'Estandarizamos y documentamos para dar claridad, garantizar cumplimiento y facilitar auditorías.',
                href: '/services',
              },
              {
                icon: Activity,
                title: 'Dashboards y Control',
                desc: 'Visualizamos lo importante. Indicadores en tiempo real para decisiones con criterio.',
                href: '/services',
              },
              {
                icon: GraduationCap,
                title: 'Capacitación',
                desc: 'Formación práctica y alineada al sistema para fortalecer equipos y ejecutar con consistencia.',
                href: '/academy',
              },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.title}
                  to={s.href}
                  className="group relative p-5 border transition-all hover:bg-[var(--bg-surface-soft)]"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
                >
                  {/* Corner reticles */}
                  <span aria-hidden="true" className="absolute top-0 left-0 w-2 h-2 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
                  <span aria-hidden="true" className="absolute bottom-0 right-0 w-2 h-2 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

                  <div className="flex items-start justify-between mb-6">
                    <span
                      className="flex items-center justify-center w-10 h-10 border"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--color-primary)', background: 'var(--bg-surface-soft)' }}
                    >
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      0{i + 1}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-semibold tracking-tight text-[var(--text-primary)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                    {s.title}
                  </h3>
                  <p className="font-mono text-[11px] leading-relaxed text-[var(--text-secondary)] mb-6 min-h-[60px]">
                    {s.desc}
                  </p>

                  <span
                    className="inline-flex items-center justify-center w-7 h-7 border transition-colors group-hover:border-[var(--color-primary)] group-hover:text-[var(--color-primary)]"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          MÉTODO OCTOPUS 7P — CPD-HOM-7P-001
         ============================================================ */}
      <section className="py-24 border-t border-[var(--border-subtle)] relative z-20" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12 reveal-on-scroll flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-3 mb-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">— Método Octopus 7P</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-[var(--text-primary)] max-w-2xl">
                Nuestro método propio en siete principios que guían cada sistema.
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 reveal-on-scroll">
            {METHODOLOGY_7P.map((item, idx) => {
              const Icon = PILLAR_ICONS[idx % PILLAR_ICONS.length];
              const num = String(idx + 1).padStart(2, '0');
              return (
                <Link
                  key={item.id}
                  to="/methodology"
                  className="group relative px-4 py-6 border transition-all hover:bg-[var(--bg-surface-soft)] flex flex-col items-center text-center"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)', minHeight: '160px' }}
                  title={item.tagline}
                >
                  {/* Corner brackets phosphor */}
                  <span aria-hidden="true" className="absolute top-0 left-0 w-2 h-2 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
                  <span aria-hidden="true" className="absolute bottom-0 right-0 w-2 h-2 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

                  {/* Number */}
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-primary)] mb-3 self-start">
                    {num}
                  </span>

                  {/* Big icon centered */}
                  <Icon
                    className="w-8 h-8 text-[var(--color-primary)] mb-3 transition-transform group-hover:scale-110"
                    strokeWidth={1.5}
                  />

                  {/* Title */}
                  <h3 className="font-display text-sm font-bold tracking-tight text-[var(--text-primary)] uppercase group-hover:text-[var(--color-primary)] transition-colors">
                    {item.letter}
                  </h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          CONTROL EN TIEMPO REAL + SISTEMA DOCUMENTAL
          CPD-OPS-CTL-001 / CPD-DOC-FMT-001
         ============================================================ */}
      <section className="py-24 border-t border-[var(--border-subtle)] relative z-20" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 reveal-on-scroll">

            {/* ========== CONTROL CENTER (3/5) ========== */}
            <div className="lg:col-span-3 relative p-6 border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
              {/* Corner brackets */}
              <span aria-hidden="true" className="absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
              <span aria-hidden="true" className="absolute top-0 right-0 w-3 h-3 border-r border-t" style={{ borderColor: 'var(--color-primary)' }} />
              <span aria-hidden="true" className="absolute bottom-0 left-0 w-3 h-3 border-l border-b" style={{ borderColor: 'var(--color-primary)' }} />
              <span aria-hidden="true" className="absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

              <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">— Control en tiempo real</span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-primary)]">
                  Período · 01 May → 31 May
                </span>
              </div>

              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-primary)] mb-4">
                Cephalopod Control Center
              </div>

              {/* KPI tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Ventas Totales',     value: '$1,248,730', delta: '+12.4%', dir: 'up'   },
                  { label: 'Costo Mercancía',    value: '28.6%',      delta: '-2.1%',  dir: 'down' },
                  { label: 'Mano de Obra',       value: '24.3%',      delta: '-1.7%',  dir: 'down' },
                  { label: 'Ticket Promedio',    value: '$34.80',     delta: '+5.3%',  dir: 'up'   },
                ].map((k) => (
                  <div key={k.label} className="p-3 border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}>
                    <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--text-muted)] mb-2">
                      {k.label}
                    </div>
                    <div className="font-mono text-xl font-bold text-[var(--text-primary)] mb-1">
                      {k.value}
                    </div>
                    <div className="font-mono text-[10px]" style={{ color: k.dir === 'up' ? 'var(--color-primary)' : 'var(--color-warning)' }}>
                      {k.delta} <span className="text-[var(--text-muted)]">vs período anterior</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Sparkline ventas por día */}
                <div className="p-3 border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}>
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--text-muted)] mb-2">Ventas por día</div>
                  <svg viewBox="0 0 200 80" className="w-full h-20" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sparkFill" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00FF9D" stopOpacity="0.32"/>
                        <stop offset="100%" stopColor="#00FF9D" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d="M 0,62 L 18,58 L 36,42 L 54,48 L 72,30 L 90,38 L 108,22 L 126,28 L 144,16 L 162,18 L 180,10 L 200,8 L 200,80 L 0,80 Z" fill="url(#sparkFill)" />
                    <polyline points="0,62 18,58 36,42 54,48 72,30 90,38 108,22 126,28 144,16 162,18 180,10 200,8" fill="none" stroke="#00FF9D" strokeWidth="1.5" />
                    {[0,18,36,54,72,90,108,126,144,162,180,200].map((x, i) => (
                      <circle key={i} cx={x} cy={[62,58,42,48,30,38,22,28,16,18,10,8][i]} r="1.5" fill="#00FF9D" />
                    ))}
                  </svg>
                  <div className="flex justify-between font-mono text-[9px] text-[var(--text-muted)] mt-1">
                    <span>1.5M</span>
                    <span>0</span>
                  </div>
                </div>

                {/* Donut Mix de Ventas */}
                <div className="p-3 border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}>
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--text-muted)] mb-2">Mix de ventas</div>
                  <div className="flex items-center justify-center gap-3">
                    <svg viewBox="0 0 100 100" className="w-20 h-20">
                      {/* 62% phosphor */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#00FF9D" strokeWidth="14"
                              strokeDasharray="155.8 251.3" transform="rotate(-90 50 50)" />
                      {/* 26% terminal */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#00C57D" strokeWidth="14"
                              strokeDasharray="65.3 251.3" strokeDashoffset="-155.8" transform="rotate(-90 50 50)" />
                      {/* 12% amber */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#FFB12A" strokeWidth="14"
                              strokeDasharray="30.2 251.3" strokeDashoffset="-221.1" transform="rotate(-90 50 50)" />
                    </svg>
                    <ul className="font-mono text-[9px] space-y-1">
                      <li className="flex items-center gap-1.5">
                        <span className="w-2 h-2 inline-block" style={{ background: '#00FF9D' }} />
                        <span className="text-[var(--text-secondary)]">Alimentos 62%</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-2 h-2 inline-block" style={{ background: '#00C57D' }} />
                        <span className="text-[var(--text-secondary)]">Bebidas 26%</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-2 h-2 inline-block" style={{ background: '#FFB12A' }} />
                        <span className="text-[var(--text-secondary)]">Otros 12%</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Gauge SOP */}
                <div className="p-3 border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}>
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--text-muted)] mb-2">Cumplimiento SOP</div>
                  <div className="flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-20 h-20">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,255,157,0.12)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#00FF9D" strokeWidth="8"
                              strokeDasharray="231.2 251.3" strokeLinecap="round"
                              transform="rotate(-90 50 50)" />
                      <text x="50" y="48" textAnchor="middle" fill="#00FF9D" fontFamily="IBM Plex Mono, monospace" fontSize="18" fontWeight="700">92%</text>
                      <text x="50" y="62" textAnchor="middle" fill="#A8B0B5" fontFamily="IBM Plex Mono, monospace" fontSize="7" letterSpacing="1">CUMPLIMIENTO</text>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Sistema actualizado hace 5 min
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Fuente · Cephalopod OS
                </span>
              </div>
            </div>

            {/* ========== SISTEMA DOCUMENTAL (2/5) ========== */}
            <div className="lg:col-span-2 relative p-6 border flex flex-col" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <span aria-hidden="true" className="absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
              <span aria-hidden="true" className="absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

              <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-6">
                — Sistema Documental
              </div>

              {/* Big code format display */}
              <div className="font-mono font-bold tracking-tight mb-1 text-[var(--color-primary)] text-2xl md:text-3xl break-all">
                CPD-[ÁREA]-[TIPO]-[###]
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--text-muted)] mb-6">
                Código de documento
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {['SOP','INS','CHK','FOR','REG','GUI','POL'].map((c) => (
                  <span
                    key={c}
                    className="font-mono text-[10px] font-semibold px-2 py-1 border"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)', color: 'var(--color-primary)' }}
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* Mapping table */}
              <ul className="font-mono text-[10px] space-y-1.5 mb-6">
                {[
                  ['SOP', 'Procedimientos Operativos Estandarizados'],
                  ['INS', 'Instructivos de Trabajo'],
                  ['CHK', 'Checklists de Verificación'],
                  ['FOR', 'Formularios y Registros'],
                  ['REG', 'Registros y Evidencias'],
                  ['GUI', 'Guías y Manuales'],
                  ['POL', 'Políticas y Protocolos'],
                ].map(([code, desc]) => (
                  <li key={code} className="flex gap-3">
                    <span className="font-bold text-[var(--color-primary)] w-8 flex-shrink-0">{code}</span>
                    <span className="text-[var(--text-secondary)]">{desc}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-4 border-t flex items-center justify-center gap-3 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-primary)]" style={{ borderColor: 'var(--border-subtle)' }}>
                <span>Trazabilidad</span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span>Control</span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span>Consistencia</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* NEWS BOARD */}
      <NewsBoard />

      {/* ============================================================
          APLICACIONES — CPD-HOM-APP-001
         ============================================================ */}
      <section className="py-24 border-t border-[var(--border-subtle)] relative z-20" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12 reveal-on-scroll flex-wrap gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">— Aplicaciones</span>
            <Link to="/services" className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors inline-flex items-center gap-2">
              Ver más casos
              <span className="inline-flex items-center justify-center w-4 h-4 border" style={{ borderColor: 'var(--border-subtle)' }}>+</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 reveal-on-scroll">
            {[
              {
                icon: LayoutGrid,
                title: 'Restaurantes',
                desc: 'Sistemas que alinean operación, experiencia y rentabilidad.',
                metrics: [
                  ['Tiempo promedio',  '−18%'],
                  ['Costo mercancía',  '−2.4pp'],
                  ['Cumplimiento SOP', '+27%'],
                ],
              },
              {
                icon: Cpu,
                title: 'Centros de Producción',
                desc: 'Control total de procesos, calidad y eficiencia operativa.',
                metrics: [
                  ['Rendimiento',      '+16%'],
                  ['Desperdicio',      '−23%'],
                  ['Trazabilidad',     '100%'],
                ],
              },
              {
                icon: GraduationCap,
                title: 'Academia / Capacitación',
                desc: 'Programas y talleres para desarrollar equipos de alto desempeño.',
                metrics: [
                  ['Evaluaciones',     '98%'],
                  ['Adopción sistema', '+35%'],
                  ['Retención',        '+22%'],
                ],
              },
            ].map((app) => {
              const Icon = app.icon;
              return (
                <div
                  key={app.title}
                  className="group relative border overflow-hidden flex flex-col"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
                >
                  {/* Corner brackets */}
                  <span aria-hidden="true" className="absolute top-0 left-0 w-3 h-3 border-l border-t z-10" style={{ borderColor: 'var(--color-primary)' }} />
                  <span aria-hidden="true" className="absolute bottom-0 right-0 w-3 h-3 border-r border-b z-10" style={{ borderColor: 'var(--color-primary)' }} />

                  {/* Image area: dark gradient + watermark icon + grid */}
                  <div className="relative h-40 overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-[0.08]"
                      style={{
                        backgroundImage:
                          'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon
                        className="text-[var(--color-primary)] opacity-25 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-40"
                        style={{ width: '88px', height: '88px' }}
                        strokeWidth={1.25}
                      />
                    </div>
                    <div className="absolute inset-0" style={{
                      background: 'linear-gradient(180deg, transparent 0%, var(--bg-surface) 100%)',
                    }} />
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                      {app.title}
                    </h3>
                    <p className="font-mono text-[11px] leading-relaxed text-[var(--text-secondary)] mb-4">
                      {app.desc}
                    </p>

                    {/* Metrics strip */}
                    <div className="mt-auto pt-4 border-t grid grid-cols-3 gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                      {app.metrics.map(([label, value]) => (
                        <div key={label} className="flex flex-col">
                          <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--text-muted)] truncate">{label}</span>
                          <span className="font-mono text-base font-bold text-[var(--color-primary)]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Arrow on hover */}
                  <Link
                    to="/services"
                    aria-label={`Ver más sobre ${app.title}`}
                    className="absolute bottom-3 right-3 inline-flex items-center justify-center w-8 h-8 border opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'var(--bg-surface)' }}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

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

      {/* ============================================================
          CTA FINAL — CPD-HOM-CTA-001
         ============================================================ */}
      <section className="py-20 border-t border-[var(--border-subtle)] relative z-20" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative p-8 md:p-12 border overflow-hidden"
            style={{
              borderColor: 'var(--border-strong)',
              background: 'var(--bg-surface)',
              boxShadow: '0 0 50px rgba(0, 255, 157, 0.10)',
            }}
          >
            {/* Corner brackets phosphor */}
            <span aria-hidden="true" className="absolute top-0 left-0 w-4 h-4 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="absolute top-0 right-0 w-4 h-4 border-r border-t" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="absolute bottom-0 left-0 w-4 h-4 border-l border-b" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="absolute bottom-0 right-0 w-4 h-4 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

            {/* Grid backdrop */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />

            <div className="relative grid grid-cols-1 md:grid-cols-[auto,1fr,auto] items-center gap-8">
              {/* Left: cephalopod logo */}
              <div className="hidden md:block w-20 h-20 flex-shrink-0">
                <OctopusMark variant="phosphor" animated />
              </div>

              {/* Center: copy */}
              <div>
                <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight uppercase text-[var(--text-primary)] leading-tight mb-3">
                  Convertí tu operación en un{' '}
                  <span className="text-[var(--color-primary)]">sistema inteligente</span>.
                </h3>
                <p className="font-mono text-xs md:text-sm uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Menos improvisación · más control. Menos caos · más criterio.
                </p>
              </div>

              {/* Right: CTA button */}
              <div className="flex-shrink-0">
                <Link to="/quick-diagnostic">
                  <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
                    Solicitar diagnóstico
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative mt-6 pt-4 border-t flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--text-muted)]" style={{ borderColor: 'var(--border-subtle)' }}>
              <span>Cephalopod · Sistemas operativos para gastronomía</span>
              <span>CPD-HOM-CTA-001</span>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
