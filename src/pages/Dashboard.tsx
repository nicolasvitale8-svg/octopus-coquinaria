import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  PlusCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Clock,
  Activity,
  Calendar as CalendarIcon,
  BookOpen,
  Building,
  Briefcase,
  Inbox,
} from 'lucide-react';
import Button from '../components/ui/Button';
import MetricCard from '../components/ui/MetricCard';
import ModuleCard from '../components/ui/ModuleCard';
import OctopusLoader from '../components/ui/OctopusLoader';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency, formatPercent } from '../services/calculations';
import {
  getDiagnosticHistory,
  getLastDiagnostic,
  getMyLeads,
} from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { SemiCircleGauge, MiniProgressRing } from '../components/dashboard/DashboardGauges';
import TickerGastronomico from '../components/TickerGastronomico';
import NewsBoard from '../components/NewsBoard';

/**
 * Dashboard — refactor con tokens del rebrand.
 *
 * Cambios respecto a versión anterior:
 *   - Bento de KPIs reescrito con MetricCard (label mono + value font-mono +
 *     gauges como children + doc-codes).
 *   - Shortcuts (Proyecto / Calendario / Academia) con ModuleCard.
 *   - Loading → OctopusLoader. Empty history → EmptyState.
 *   - Status de cada fila del historial → StatusBadge.
 *   - Reemplazados todos los hex hardcodeados (#021019, #1FB6D5, #00344F,
 *     #F2B350, #1FA77A) por var(--token).
 *   - Tipografía hero: Sora display.
 *   - Gauges siguen usando #1FB6D5/#1FA77A/#F2B350 internos del componente
 *     (no se tocan para no romper export); se les pasa color por prop.
 */

const Dashboard = () => {
  const { user, profile, isAdmin, isConsultant, isLoading: isAuthLoading } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [lastDiagnostic, setLastDiagnostic] = useState<any>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthLoading) return;

    const loadData = async () => {
      setIsDataLoading(true);

      const storedHistory = getDiagnosticHistory();
      const storedLast = getLastDiagnostic();

      if (storedHistory && storedHistory.length > 0) {
        mapAndSetHistory(storedHistory);
        if (storedLast) setLastDiagnostic(storedLast);
      }

      if (profile?.email) {
        const remoteLeads = await getMyLeads(profile.email);
        if (remoteLeads && remoteLeads.length > 0) {
          mapAndSetHistory(remoteLeads);
          setLastDiagnostic(remoteLeads[0]);
        }
      }

      setIsDataLoading(false);
    };

    const mapAndSetHistory = (data: any[]) => {
      const mappedHistory = data.map((d) => ({
        month: d.date
          ? new Date(d.date).toLocaleDateString('es-AR', { month: 'short' })
          : 'Mes',
        sales: d.monthly_revenue || d.monthlyRevenue || d.totalSales || d.amount || 0,
        cogs: d.cogsPercentage || d.cogs_percentage || 0,
        labor: d.laborPercentage || d.labor_percentage || 0,
        result: d.marginPercentage || d.margin_percentage || d.result || 0,
        isReal: true,
      }));
      setHistory(mappedHistory.reverse());
    };

    loadData();
  }, [profile, isAuthLoading, navigate]);

  // ─── Derived values for KPI cards ───────────────────────────────
  const ventas =
    lastDiagnostic?.monthly_revenue ||
    lastDiagnostic?.monthlyRevenue ||
    lastDiagnostic?.totalSales ||
    lastDiagnostic?.amount ||
    0;
  const margen = lastDiagnostic?.marginPercentage || 0;
  const cmv =
    lastDiagnostic?.cogsPercentage || lastDiagnostic?.cogs_percentage || 0;

  const margenTone = margen > 15 ? 'success' : margen > 8 ? 'warning' : 'danger';
  const cmvTone = cmv > 35 ? 'danger' : cmv > 30 ? 'warning' : 'success';

  // Map de status del historial
  const rowStatus = (resultPct: number) =>
    resultPct > 15 ? 'success' : resultPct > 8 ? 'warning' : 'danger';

  return (
    <Layout user={user}>
      <TickerGastronomico />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* ============================================================
            HERO / WELCOME
            OCT-DASH-HERO-001
           ============================================================ */}
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="space-y-1">
            <div className="mb-2 flex items-center gap-2 text-[var(--color-primary)]">
              <Zap className="h-5 w-5" strokeWidth={2} />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em]">
                Control de Gestión · OCT-DASH-V4
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">
              Hola,{' '}
              <span className="text-gradient-gold">
                {profile?.name || 'Gastronómico'}
              </span>
            </h1>
            <p className="max-w-xl text-base md:text-lg text-[var(--text-secondary)]">
              Monitor de salud operativa y financiera de tu negocio en tiempo real.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {isAdmin || isConsultant ? (
              <Link to="/quick-diagnostic">
                <Button variant="secondary" size="lg">
                  Nuevo Rápido
                </Button>
              </Link>
            ) : (
              <Link to="/hub/my-project">
                <Button variant="secondary" size="lg" icon={Building}>
                  Mi Proyecto
                </Button>
              </Link>
            )}
            <Link to="/deep-diagnostic">
              <Button variant="primary" size="lg" icon={PlusCircle}>
                Cargar Mes
              </Button>
            </Link>
          </div>
        </div>

        {/* ============================================================
            BENTO GRID — KPIs + Chart + Modules
            OCT-DASH-BENTO-001
           ============================================================ */}
        {isDataLoading ? (
          <OctopusLoader variant="card-skeleton" cards={6} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* KPI 1 — Ventas */}
            <div className="md:col-span-4">
              <MetricCard
                label="Volumen de Ventas (Fuerza de Venta)"
                icon={Activity}
                tone="primary"
                size="lg"
                docCode="OCT-DASH-KPI-001"
                value={ventas ? formatCurrency(ventas) : '$ —'}
              >
                <MiniProgressRing
                  value={lastDiagnostic?.scoreGlobal || 0}
                  label="Salud Global"
                  color="#00FF9D"
                />
              </MetricCard>
            </div>

            {/* KPI 2 — Margen Bruto */}
            <div className="md:col-span-4">
              <MetricCard
                label="Margen Bruto"
                icon={Target}
                tone={margenTone}
                size="lg"
                docCode="OCT-DASH-KPI-002"
                value={`${margen.toFixed(1)}%`}
              >
                <SemiCircleGauge
                  value={margen}
                  label="Resultado"
                  color={
                    margenTone === 'success'
                      ? '#00C57D'
                      : margenTone === 'warning'
                      ? '#FFB12A'
                      : '#FF4D4D'
                  }
                />
              </MetricCard>
            </div>

            {/* KPI 3 — CMV */}
            <div className="md:col-span-4">
              <MetricCard
                label="Costo de Ventas (Insumos)"
                icon={TrendingDown}
                tone={cmvTone}
                size="lg"
                docCode="OCT-DASH-KPI-003"
                value={`${cmv.toFixed(1)}%`}
              >
                <SemiCircleGauge
                  value={cmv}
                  label="Costo %"
                  color={
                    cmvTone === 'success'
                      ? '#00C57D'
                      : cmvTone === 'warning'
                      ? '#FFB12A'
                      : '#FF4D4D'
                  }
                />
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  * impacto de insumos sobre total vendido
                </p>
              </MetricCard>
            </div>

            {/* MAIN CHART — Evolución Costos */}
            <div
              className="md:col-span-8 relative border p-6 md:p-8"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span aria-hidden="true" className="absolute top-0 left-0 w-2.5 h-2.5 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
              <span aria-hidden="true" className="absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />
              <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-display text-lg md:text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                    Evolución de Costos
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Comparativa de los últimos 6 meses registrados.
                  </p>
                </div>
                <div className="flex gap-5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: 'var(--color-primary-dark)' }}
                    />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                      % Insumos (CMV)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: 'var(--color-primary)' }}
                    />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                      % Mano de Obra
                    </span>
                  </div>
                </div>
              </div>

              {history.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  variant="bare"
                  title="Aún no hay diagnósticos cargados"
                  body="Cargá tu primer mes para empezar a ver evolución de costos y márgenes."
                  cta={{ label: 'Cargar primer mes', href: '/deep-diagnostic' }}
                />
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={history}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(243, 239, 228, 0.06)"
                      />
                      <XAxis
                        dataKey="month"
                        stroke="#636A6F"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="#636A6F"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(0, 255, 157, 0.06)' }}
                        contentStyle={{
                          backgroundColor: '#0F1416',
                          border: '1px solid rgba(0, 255, 157, 0.30)',
                          borderRadius: '4px',
                          color: '#E6E8E5',
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '12px',
                        }}
                        labelStyle={{ color: '#00FF9D', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      />
                      <Bar dataKey="cogs" fill="#00B070" radius={[2, 2, 0, 0]} barSize={20} />
                      <Bar dataKey="labor" fill="#00FF9D" radius={[2, 2, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Modules */}
            <div className="md:col-span-4 grid grid-rows-2 gap-4">
              <ModuleCard
                title="Proyecto 7P"
                description="Seguimiento mensual de tu plan operativo según método Cephalopod."
                icon={Briefcase}
                kicker="Seguimiento"
                tone="primary"
                variant="feature"
                cta="Ir al proyecto"
                docCode="OCT-DASH-MOD-001"
                href={
                  profile?.businessIds?.[0]
                    ? `/hub/projects/${profile.businessIds[0]}`
                    : '/hub/my-project'
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <ModuleCard
                  title="Calendario"
                  icon={CalendarIcon}
                  tone="cyan"
                  variant="compact"
                  href="/calendar"
                />
                <ModuleCard
                  title="Academia"
                  icon={BookOpen}
                  tone="primary"
                  variant="compact"
                  href="/academy"
                />
              </div>
            </div>

            {/* HISTORY TABLE */}
            <div
              className="md:col-span-12 overflow-hidden rounded-xl border"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div
                className="flex items-center justify-between gap-4 border-b px-6 py-5 md:px-8"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                    Historial de Reportes
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Trazabilidad de tus diagnósticos rápidos y profundos.
                  </p>
                </div>
                <Button variant="ghost" size="sm" icon={FileText}>
                  Descargar CSV
                </Button>
              </div>

              {history.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  variant="bare"
                  title="Sin reportes todavía"
                  body="Apenas cargues un diagnóstico, vas a verlo acá listado y descargable."
                  cta={{ label: 'Cargar diagnóstico', href: '/deep-diagnostic' }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-separate border-spacing-0">
                    <thead
                      className="text-[10px] uppercase font-bold tracking-[0.18em] text-[var(--text-muted)]"
                      style={{ background: 'var(--bg-surface-soft)' }}
                    >
                      <tr>
                        <th className="px-6 py-4 md:px-8">Periodo</th>
                        <th className="px-6 py-4 md:px-8">Estado</th>
                        <th className="px-6 py-4 md:px-8 text-right">Fuerza de Venta</th>
                        <th className="px-6 py-4 md:px-8 text-center">Rendimiento (Utilidad)</th>
                        <th className="px-6 py-4 md:px-8 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item, index) => {
                        const tone = rowStatus(item.result);
                        return (
                          <tr
                            key={index}
                            className="group border-t transition-colors hover:bg-[var(--bg-surface-soft)]/50"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          >
                            <td className="px-6 py-4 md:px-8 font-display font-semibold text-[var(--text-primary)] capitalize">
                              {item.month}
                            </td>
                            <td className="px-6 py-4 md:px-8">
                              <StatusBadge tone={tone} variant="soft" size="sm" dot>
                                {item.isReal ? 'Registrado' : 'Proyectado'}
                              </StatusBadge>
                            </td>
                            <td className="px-6 py-4 md:px-8 text-right font-mono text-sm font-semibold text-[var(--text-primary)]">
                              {formatCurrency(item.sales)}
                            </td>
                            <td className="px-6 py-4 md:px-8 text-center">
                              <StatusBadge tone={tone} variant="solid" size="sm">
                                {formatPercent(item.result)}
                              </StatusBadge>
                            </td>
                            <td className="px-6 py-4 md:px-8 text-center">
                              <button
                                type="button"
                                className="rounded-md p-2 text-[var(--text-muted)] transition-all hover:bg-[var(--bg-surface-soft)] hover:text-[var(--color-primary)]"
                                aria-label="Ver detalle"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER INFO */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 border-t pt-6 opacity-60"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 text-xs">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ background: 'var(--color-success)' }}
            />
            <span className="font-mono uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Sincronización Cloud activa
            </span>
          </div>
          <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
            <span className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Reporte generado · {new Date().toLocaleDateString('es-AR')}
            </span>
          </div>
        </div>
      </div>

      <NewsBoard />
    </Layout>
  );
};

export default Dashboard;
