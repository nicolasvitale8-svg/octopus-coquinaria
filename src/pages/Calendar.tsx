
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { WHATSAPP_NUMBER } from '../constants';
import { Calendar as CalendarIcon, AlertTriangle, TrendingUp, Sun, ShoppingCart, Info, ArrowLeft, MessageCircle, ChevronDown, ChevronRight, X, HelpCircle, Edit3, Trash2, Save, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../services/logger';
import { ALL_BUSINESS_TYPES, BUSINESS_TYPE_LABELS, BusinessType, CalendarEvent } from '../services/calendarService';
import { exportCalendarToGoogleCSV } from '../services/googleCalendarExport';

export const getEventIcon = (type: string) => {
  switch (type) {
    case 'feriado': return <CalendarIcon className="w-5 h-5 text-[var(--color-primary)]" />;
    case 'clima': return <Sun className="w-5 h-5 text-[var(--color-warning)]" />;
    case 'tendencia_consumo':
    case 'comercial': return <TrendingUp className="w-5 h-5 text-[var(--color-success)]" />;
    default: return <Info className="w-5 h-5 text-[var(--text-muted)]" />;
  }
};

export const getPriorityBadge = (priority: number) => {
  if (priority === 3) return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[rgba(255,77,77,0.12)]/30 text-[var(--color-danger)] border border-[rgba(255,77,77,0.45)]">Alta Prioridad</span>;
  if (priority === 2) return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-900/30 text-[var(--color-warning)] border border-yellow-900/50">Media</span>;
  return null;
};

const EventItem = React.memo(({ evt, isFutureOrToday, onEventClick }: { evt: any, isFutureOrToday: boolean, onEventClick: (evt: any) => void }) => {
  return (
    <div
      id={`event-${evt.id}`}
      data-future={isFutureOrToday}
      onClick={() => onEventClick(evt)}
      className="bg-[var(--bg-base)] rounded-md border border-[var(--border-subtle)] p-4 hover:border-[var(--color-primary)]/50 transition-all group relative overflow-hidden cursor-pointer hover:bg-[var(--bg-surface)]/50 flex items-center gap-4"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${evt.prioridad === 3 ? 'bg-[var(--color-danger)]' : (evt.prioridad === 2 ? 'bg-[var(--color-primary)]' : 'bg-[var(--bg-surface-soft)]')}`}></div>
      <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-2 min-w-[70px] text-center flex flex-col justify-center items-center">
        <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold tracking-wider">
          {new Date(evt.fecha_inicio.split('T')[0] + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}
        </span>
        <span className={`text-2xl font-bold font-sans ${isFutureOrToday ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
          {new Date(evt.fecha_inicio.split('T')[0] + 'T00:00:00').getDate()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`text-lg font-bold truncate ${isFutureOrToday ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
          {evt.titulo}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {getPriorityBadge(evt.prioridad)}
          <span className="flex items-center text-xs font-bold uppercase text-[var(--text-muted)] tracking-wider">
            {getEventIcon(evt.tipo)}
            <span className="ml-1 text-[10px]">{evt.tipo.replace('_', ' ')}</span>
          </span>
        </div>
      </div>
      <div className="text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors">
        <ChevronDown className="w-5 h-5 -rotate-90" />
      </div>
    </div>
  );
});
EventItem.displayName = 'EventItem';

const CalendarPage = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'consultant';

  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [showGuide, setShowGuide] = useState(false);

  // Filtro por tipo de negocio
  const [filterByBusinessType, setFilterByBusinessType] = useState(true); // ON por defecto
  const [myBusinessType, setMyBusinessType] = useState<BusinessType>('RESTAURANTE'); // Tipo del usuario

  // Event Edit State
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ titulo: '', mensaje: '', tipo: 'feriado', prioridad: 1, businessTypes: ALL_BUSINESS_TYPES as BusinessType[] });
  const [isSaving, setIsSaving] = useState(false);

  const fetchEvents = async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('eventos_calendario')
      .select('*')
      .order('fecha_inicio', { ascending: true });

    logger.debug('Fetched calendar events', { context: 'Calendar', data: { count: data?.length, error: error?.message } });

    if (data) {
      setEvents(data);

      // Expand current month by default
      const now = new Date();
      const currentMonthRaw = now.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
      const currentMonthKey = currentMonthRaw.charAt(0).toUpperCase() + currentMonthRaw.slice(1);

      setExpandedMonths({ [currentMonthKey]: true });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEventClick = (evt: any) => {
    setSelectedEvent(evt);
    setEditForm({
      titulo: evt.titulo || '',
      mensaje: evt.mensaje || '',
      tipo: evt.tipo || 'feriado',
      prioridad: evt.prioridad || 1,
      businessTypes: evt.business_types || ALL_BUSINESS_TYPES
    });
    setEditMode(false);
  };

  const handleSaveEvent = async () => {
    if (!supabase || !selectedEvent) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('eventos_calendario')
      .update({
        titulo: editForm.titulo,
        mensaje: editForm.mensaje,
        tipo: editForm.tipo,
        prioridad: editForm.prioridad,
        business_types: editForm.businessTypes
      })
      .eq('id', selectedEvent.id);

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      await fetchEvents();
      setSelectedEvent(null);
    }
    setIsSaving(false);
  };

  const handleDeleteEvent = async () => {
    if (!supabase || !selectedEvent) return;
    if (!confirm(`¿Eliminar el evento "${selectedEvent.titulo}"? Esta acción es irreversible.`)) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('eventos_calendario')
      .delete()
      .eq('id', selectedEvent.id);

    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      await fetchEvents();
      setSelectedEvent(null);
    }
    setIsSaving(false);
  };


  // Filtrar eventos por tipo de negocio si está activo
  const filteredEvents = React.useMemo(() => {
    return filterByBusinessType
      ? events.filter(event => {
        const eventBusinessTypes = event.business_types || ALL_BUSINESS_TYPES;
        return eventBusinessTypes.includes(myBusinessType);
      })
      : events;
  }, [events, filterByBusinessType, myBusinessType]);

  // Group events by Month
  const eventsByMonth = React.useMemo(() => {
    return filteredEvents.reduce((groups, event) => {
      // Robust Fix: Force Local Date (YYYY-MM-DD T 00:00:00)
      const datePart = event.fecha_inicio.split('T')[0];
      const date = new Date(`${datePart}T00:00:00`);

      // Capitalize manually as toLocaleString might be lowercase in some browsers
      const rawMonth = date.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
      const monthKey = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);

      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(event);
      return groups;
    }, {} as Record<string, any[]>);
  }, [filteredEvents]);

  // Auto-scroll to nearest future event
  useEffect(() => {
    if (!isLoading && Object.keys(eventsByMonth).length > 0) {
      // Small timeout to ensure DOM update
      setTimeout(() => {
        const futureEvent = document.querySelector('[data-future="true"]');
        if (futureEvent) {
          futureEvent.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [events, expandedMonths, isLoading]);

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  const handleEventClickCb = React.useCallback(handleEventClick, []);

  return (
    <Layout>
      <div className="bg-[#050607] min-h-screen pt-8 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <Link to="/" className="inline-flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Inicio
          </Link>

          {/* Sticky Header */}
          <div className="sticky top-16 z-30 bg-[#050607] backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 border-b border-[var(--border-subtle)]/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] font-space">Calendario Gastronómico</h1>
                <p className="text-sm text-[var(--text-muted)] max-w-xl mt-1 hidden md:block">
                  Anticipate a lo que viene. Feriados, alertas y tendencias.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => setShowGuide(true)} variant="outline" className="border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] text-xs px-3 py-2">
                  <HelpCircle className="w-4 h-4 mr-1" /> Guía
                </Button>
                <Button
                  onClick={() => {
                    const mappedEvents: CalendarEvent[] = events.map(e => ({
                      id: e.id,
                      title: e.titulo,
                      description: e.mensaje,
                      start_date: e.fecha_inicio,
                      end_date: e.fecha_fin,
                      type: e.tipo,
                      business_types: e.business_types,
                      tags: e.tags
                    }));
                    exportCalendarToGoogleCSV(mappedEvents, new Date().getFullYear());
                  }}
                  variant="outline"
                  className="border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] text-xs px-3 py-2"
                >
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
                  <Button className="bg-[var(--color-primary)] text-[#050607] hover:bg-white font-bold text-xs px-3 py-2">
                    <MessageCircle className="w-4 h-4 mr-1" /> Sugerir
                  </Button>
                </a>
              </div>
            </div>

            {/* Filtro por tipo de negocio */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFilterByBusinessType(!filterByBusinessType)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${filterByBusinessType ? 'bg-[var(--color-primary)]' : 'bg-[var(--bg-surface-soft)]'
                    }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${filterByBusinessType ? 'translate-x-5' : 'translate-x-1'
                      }`}
                  />
                </button>
                <span className="text-xs text-[var(--text-primary)] font-medium">
                  {filterByBusinessType ? 'Filtrado por tipo' : 'Todos'}
                </span>
              </div>

              {filterByBusinessType && (
                <select
                  value={myBusinessType}
                  onChange={(e) => setMyBusinessType(e.target.value as BusinessType)}
                  className="bg-[var(--bg-base)] border border-[var(--border-strong)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)] focus:border-[var(--color-primary)] outline-none"
                >
                  {ALL_BUSINESS_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {BUSINESS_TYPE_LABELS[bt]}
                    </option>
                  ))}
                </select>
              )}

              <div className="text-[10px] text-[var(--text-muted)] ml-auto">
                {filteredEvents.length}/{events.length}
              </div>
            </div>
          </div>


          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-20 text-[var(--text-muted)]">Cargando eventos...</div>
            ) : Object.keys(eventsByMonth).length > 0 ? (
              Object.entries(eventsByMonth).map(([month, monthEvents]) => {
                const isExpanded = expandedMonths[month];
                const eventsList = monthEvents as any[];
                return (
                  <div key={month} className="animate-fade-in border-b border-[var(--border-subtle)] pb-4">
                    <button
                      onClick={() => toggleMonth(month)}
                      className="w-full flex items-center justify-between text-2xl font-bold text-[var(--text-primary)] mb-4 capitalize font-space sticky top-24 bg-[#050607]/95 backdrop-blur py-4 z-10 hover:text-[var(--color-primary)] transition-colors group"
                    >
                      <span className="flex items-center">
                        {isExpanded ? <ChevronDown className="w-6 h-6 mr-3 text-[var(--color-primary)]" /> : <ChevronRight className="w-6 h-6 mr-3 text-[var(--text-muted)]" />}
                        {month}
                      </span>
                      <span className="text-xs font-mono text-[var(--text-muted)] group-hover:text-[var(--text-muted)]">
                        {eventsList.length} {eventsList.length === 1 ? 'evento' : 'eventos'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="grid grid-cols-1 gap-4 animate-slide-down">
                        {(monthEvents as any[]).map((evt: any) => {
                          // Check if this event is today or future to potentially scroll to it
                          const eventDate = new Date(evt.fecha_inicio);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const isFutureOrToday = eventDate >= today;

                          return (
                            <EventItem
                              key={evt.id}
                              evt={evt}
                              isFutureOrToday={isFutureOrToday}
                              onEventClick={handleEventClickCb}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20">
                <p className="text-[var(--text-muted)] mb-4">No hay eventos próximos cargados.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button - Exportar CSV */}
      <button
        onClick={() => {
          const mappedEvents: CalendarEvent[] = events.map(e => ({
            id: e.id,
            title: e.titulo,
            description: e.mensaje,
            start_date: e.fecha_inicio,
            end_date: e.fecha_fin,
            type: e.tipo,
            business_types: e.business_types,
            tags: e.tags
          }));
          exportCalendarToGoogleCSV(mappedEvents, new Date().getFullYear());
        }}
        className="fixed bottom-6 right-6 z-40 bg-[var(--color-primary)] hover:bg-white text-[#050607] p-4 rounded-full shadow-2xl shadow-[var(--color-primary)]/30 transition-all hover:scale-110 active:scale-95 group"
        title="Exportar calendario a Google Calendar (CSV)"
      >
        <Download className="w-6 h-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[var(--bg-base)] text-[var(--text-primary)] text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
          Exportar a Google Calendar
        </span>
      </button>

      {/* Modal de Guía */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-scale-in">
            {/* Header Sticky */}
            <div className="sticky top-0 bg-[var(--bg-base)] border-b border-[var(--border-subtle)] rounded-t-2xl p-6 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-8 h-8 text-[var(--color-primary)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)] font-space">🗓 Guía para leer el Calendario</h2>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-auto p-8 space-y-6">
              <p className="text-[var(--text-secondary)] text-lg font-medium">El calendario no es decorativo: <span className="text-[var(--color-primary)]">es tu plan operativo.</span></p>

              {/* Tipos de Evento */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">1. Tipos de evento</h3>
                <div className="grid gap-3">
                  <div className="bg-[#0F1416]/30 border border-[var(--color-primary)]/30 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="w-5 h-5 text-[var(--color-primary)]" />
                      <span className="font-bold text-[var(--color-primary)]">FERIADO</span>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm">Algo externo que mueve la demanda. Ej: feriados nacionales, fines de semana largos. Te sirve para decidir si abrís, con qué horario y con cuánta gente.</p>
                  </div>
                  <div className="bg-green-900/20 border border-[rgba(0,197,125,0.30)] rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-[var(--color-success)]" />
                      <span className="font-bold text-[var(--color-success)]">COMERCIAL</span>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm">Acción para vender más o mejor. Ej: San Valentín, Día del Amigo, Noche de Malbec. Ideas de promos, menús especiales y foco de venta.</p>
                  </div>
                  <div className="bg-[var(--bg-surface)]/50 border border-[var(--border-strong)] rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-5 h-5 text-[var(--text-muted)]" />
                      <span className="font-bold text-[var(--text-secondary)]">INTERNO</span>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm">Cosas de puertas para adentro. Ej: inventarios, cambios de carta, reuniones. No traen gente, pero ordenan tu operación.</p>
                  </div>
                </div>
              </div>

              {/* Cómo leer las Notas */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">2. Cómo leer las Notas / Descripción</h3>
                <p className="text-[var(--text-muted)] text-sm">Las notas están pensadas como pasos de acción, no como novela:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[var(--bg-surface)] rounded-lg p-3 text-center">
                    <div className="text-[var(--color-primary)] font-bold text-lg">H-72</div>
                    <div className="text-[var(--text-muted)] text-xs">3 días antes</div>
                    <div className="text-[var(--text-secondary)] text-[10px] mt-1">Decisiones grandes</div>
                  </div>
                  <div className="bg-[var(--bg-surface)] rounded-lg p-3 text-center">
                    <div className="text-[var(--color-warning)] font-bold text-lg">H-24</div>
                    <div className="text-[var(--text-muted)] text-xs">Día anterior</div>
                    <div className="text-[var(--text-secondary)] text-[10px] mt-1">Ajustes finos</div>
                  </div>
                  <div className="bg-[var(--bg-surface)] rounded-lg p-3 text-center">
                    <div className="text-[var(--color-success)] font-bold text-lg">Día D</div>
                    <div className="text-[var(--text-muted)] text-xs">Mismo día</div>
                    <div className="text-[var(--text-secondary)] text-[10px] mt-1">Foco del servicio</div>
                  </div>
                  <div className="bg-[var(--bg-surface)] rounded-lg p-3 text-center">
                    <div className="text-[var(--color-primary)] font-bold text-lg">Post</div>
                    <div className="text-[var(--text-muted)] text-xs">Después</div>
                    <div className="text-[var(--text-secondary)] text-[10px] mt-1">Registrar aprendizajes</div>
                  </div>
                </div>
                <p className="text-[var(--color-primary)] text-sm font-medium">👉 Si vas corto de tiempo: leé Título + Tipo + H-24 + Día D</p>
              </div>

              <div className="pt-4 flex justify-end border-t border-[var(--border-subtle)]">
                <Button onClick={() => setShowGuide(false)} className="bg-[var(--color-primary)] text-[#050607] hover:bg-white font-bold">
                  Entendido 👍
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Evento (Ver/Editar) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in pt-12 md:pt-4">
          <div className="relative bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-scale-in my-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[var(--bg-base)] border-b border-[var(--border-subtle)] rounded-t-2xl p-6 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-[var(--color-primary)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{editMode ? 'Editar Evento' : 'Detalle del Evento'}</h2>
              </div>
              <button
                onClick={() => { setSelectedEvent(null); setEditMode(false); }}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-auto p-6 space-y-4">
              {editMode ? (
                // Edit Form
                <>
                  <div>
                    <label className="block text-sm text-[var(--text-muted)] mb-1">Título</label>
                    <input
                      type="text"
                      value={editForm.titulo}
                      onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--color-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-muted)] mb-1">Descripción / Notas</label>
                    <textarea
                      value={editForm.mensaje}
                      onChange={(e) => setEditForm({ ...editForm, mensaje: e.target.value })}
                      rows={6}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--color-primary)] outline-none resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-1">Tipo</label>
                      <select
                        value={editForm.tipo}
                        onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })}
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--color-primary)] outline-none"
                      >
                        <option value="feriado">Feriado</option>
                        <option value="comercial">Comercial</option>
                        <option value="interno">Interno</option>
                        <option value="clima">Clima</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-1">Prioridad</label>
                      <select
                        value={editForm.prioridad}
                        onChange={(e) => setEditForm({ ...editForm, prioridad: parseInt(e.target.value) })}
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--color-primary)] outline-none"
                      >
                        <option value={1}>Baja</option>
                        <option value={2}>Media</option>
                        <option value={3}>Alta</option>
                      </select>
                    </div>
                  </div>

                  {/* Negocios objetivo */}
                  <div>
                    <label className="block text-sm text-[var(--text-muted)] mb-1">Negocios objetivo</label>
                    <p className="text-xs text-[var(--text-muted)] mb-2">¿Para qué tipo de local aplica este evento?</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ALL_BUSINESS_TYPES.map((bt) => (
                        <label
                          key={bt}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${editForm.businessTypes.includes(bt)
                            ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-[#050607]'
                            : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                            } border`}
                        >
                          <input
                            type="checkbox"
                            checked={editForm.businessTypes.includes(bt)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditForm({
                                  ...editForm,
                                  businessTypes: [...editForm.businessTypes, bt]
                                });
                              } else {
                                setEditForm({
                                  ...editForm,
                                  businessTypes: editForm.businessTypes.filter(t => t !== bt)
                                });
                              }
                            }}
                            className="sr-only"
                          />
                          <span className={`w-4 h-4 rounded flex items-center justify-center border ${editForm.businessTypes.includes(bt)
                            ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                            : 'border-[var(--border-strong)]'
                            }`}>
                            {editForm.businessTypes.includes(bt) && (
                              <svg className="w-3 h-3 text-[var(--text-primary)]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                          <span className="text-sm font-medium">{BUSINESS_TYPE_LABELS[bt]}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-2">
                      Todas marcadas = evento general para todos los negocios
                    </p>
                  </div>
                </>
              ) : (
                // Read-Only View
                <>
                  <div className="flex items-center gap-3 mb-4">
                    {getEventIcon(selectedEvent.tipo)}
                    <span className="text-xs font-bold uppercase text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-1 rounded">
                      {selectedEvent.tipo?.replace('_', ' ')}
                    </span>
                    {getPriorityBadge(selectedEvent.prioridad)}
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{selectedEvent.titulo}</h3>
                  <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-4">
                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap font-sans">{selectedEvent.description || selectedEvent.mensaje || 'Sin descripción.'}</p>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-4 capitalize">
                    {new Date(selectedEvent.fecha_inicio.split('T')[0] + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {isAdmin && (
              <div className="p-6 border-t border-[var(--border-subtle)] flex justify-between">
                {editMode ? (
                  <>
                    <Button onClick={() => setEditMode(false)} variant="outline" className="border-[var(--border-strong)] text-[var(--text-secondary)]">
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveEvent} disabled={isSaving} className="bg-[var(--color-primary)] text-[#050607] hover:bg-white font-bold">
                      <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleDeleteEvent} disabled={isSaving} variant="outline" className="border-[var(--color-danger)]/50 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10">
                      <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                    </Button>
                    <Button onClick={() => setEditMode(true)} className="bg-[var(--color-primary)] text-[#050607] hover:bg-white font-bold">
                      <Edit3 className="w-4 h-4 mr-2" /> Editar
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </Layout>
  );
};

export default CalendarPage;
