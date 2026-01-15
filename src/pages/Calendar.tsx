
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { WHATSAPP_NUMBER } from '../constants';
import { Calendar as CalendarIcon, AlertTriangle, TrendingUp, Sun, ShoppingCart, Info, ArrowLeft, MessageCircle, ChevronDown, ChevronRight, X, HelpCircle, Edit3, Trash2, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../services/logger';
import { ALL_BUSINESS_TYPES, BUSINESS_TYPE_LABELS, BusinessType } from '../services/calendarService';

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
  const filteredEvents = filterByBusinessType
    ? events.filter(event => {
      const eventBusinessTypes = event.business_types || ALL_BUSINESS_TYPES;
      return eventBusinessTypes.includes(myBusinessType);
    })
    : events;

  // Group events by Month
  const eventsByMonth = filteredEvents.reduce((groups, event) => {
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

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'feriado':
        return <CalendarIcon className="w-5 h-5 text-[#1FB6D5]" />;
      case 'clima':
        return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'tendencia_consumo':
      case 'comercial':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority === 3) return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-900/30 text-red-400 border border-red-900/50">Alta Prioridad</span>;
    if (priority === 2) return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-900/30 text-yellow-400 border border-yellow-900/50">Media</span>;
    return null; // Don't show badge for low priority to keep clean
  };

  return (
    <Layout>
      <div className="bg-[#021019] min-h-screen pt-8 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Inicio
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-4 font-space">Calendario Gastronómico</h1>
              <p className="text-xl text-slate-400 max-w-2xl">
                Anticipate a lo que viene. Feriados, alertas climáticas y tendencias para ajustar tu operación a tiempo.
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowGuide(true)} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <HelpCircle className="w-4 h-4 mr-2" /> Cómo leer
              </Button>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
                <Button className="bg-[#1FB6D5] text-[#021019] hover:bg-white font-bold">
                  <MessageCircle className="w-4 h-4 mr-2" /> Sugerir un evento
                </Button>
              </a>
            </div>
          </div>

          {/* Filtro por tipo de negocio */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilterByBusinessType(!filterByBusinessType)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${filterByBusinessType ? 'bg-[#1FB6D5]' : 'bg-slate-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${filterByBusinessType ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
              <span className="text-sm text-white font-medium">
                {filterByBusinessType ? 'Eventos para mi tipo de local' : 'Ver todos los eventos'}
              </span>
            </div>

            {filterByBusinessType && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Mi negocio:</span>
                <select
                  value={myBusinessType}
                  onChange={(e) => setMyBusinessType(e.target.value as BusinessType)}
                  className="bg-slate-950 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:border-[#1FB6D5] outline-none"
                >
                  {ALL_BUSINESS_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {BUSINESS_TYPE_LABELS[bt]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="text-xs text-slate-500 ml-auto">
              {filteredEvents.length} de {events.length} eventos
            </div>
          </div>


          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-20 text-slate-500">Cargando eventos...</div>
            ) : Object.keys(eventsByMonth).length > 0 ? (
              Object.entries(eventsByMonth).map(([month, monthEvents]) => {
                const isExpanded = expandedMonths[month];
                const eventsList = monthEvents as any[];
                return (
                  <div key={month} className="animate-fade-in border-b border-slate-800 pb-4">
                    <button
                      onClick={() => toggleMonth(month)}
                      className="w-full flex items-center justify-between text-2xl font-bold text-white mb-4 capitalize font-space sticky top-24 bg-[#021019]/95 backdrop-blur py-4 z-10 hover:text-[#1FB6D5] transition-colors group"
                    >
                      <span className="flex items-center">
                        {isExpanded ? <ChevronDown className="w-6 h-6 mr-3 text-[#1FB6D5]" /> : <ChevronRight className="w-6 h-6 mr-3 text-slate-600" />}
                        {month}
                      </span>
                      <span className="text-xs font-mono text-slate-500 group-hover:text-slate-400">
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
                            <div
                              key={evt.id}
                              id={`event-${evt.id}`}
                              data-future={isFutureOrToday}
                              onClick={() => handleEventClick(evt)}
                              className="bg-slate-900 rounded-xl border border-slate-800 p-4 hover:border-[#1FB6D5]/50 transition-all group relative overflow-hidden cursor-pointer hover:bg-slate-800/50 flex items-center gap-4"
                            >
                              {/* Left accent border based on PRIORITY */}
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${evt.prioridad === 3 ? 'bg-red-500' : (evt.prioridad === 2 ? 'bg-[#1FB6D5]' : 'bg-slate-700')}`}></div>

                              {/* Date Box */}
                              <div className="bg-slate-950 border border-slate-700 rounded-lg p-2 min-w-[70px] text-center flex flex-col justify-center items-center">
                                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                                  {new Date(evt.fecha_inicio.split('T')[0] + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}
                                </span>
                                <span className={`text-2xl font-bold font-sans ${isFutureOrToday ? 'text-white' : 'text-slate-500'}`}>
                                  {new Date(evt.fecha_inicio.split('T')[0] + 'T00:00:00').getDate()}
                                </span>
                              </div>

                              {/* Title & Type */}
                              <div className="flex-1 min-w-0">
                                <h3 className={`text-lg font-bold truncate ${isFutureOrToday ? 'text-white' : 'text-slate-400'}`}>
                                  {evt.titulo}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  {getPriorityBadge(evt.prioridad)}
                                  <span className="flex items-center text-xs font-bold uppercase text-slate-500 tracking-wider">
                                    {getEventIcon(evt.tipo)}
                                    <span className="ml-1 text-[10px]">{evt.tipo.replace('_', ' ')}</span>
                                  </span>
                                </div>
                              </div>

                              {/* Expand Icon */}
                              <div className="text-slate-600 group-hover:text-[#1FB6D5] transition-colors">
                                <ChevronDown className="w-5 h-5 -rotate-90" />
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-400 mb-4">No hay eventos próximos cargados.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Guía */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-scale-in">
            {/* Header Sticky */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 rounded-t-2xl p-6 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-8 h-8 text-[#1FB6D5]" />
                <h2 className="text-xl font-bold text-white font-space">🗓 Guía para leer el Calendario</h2>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-auto p-8 space-y-6">
              <p className="text-slate-300 text-lg font-medium">El calendario no es decorativo: <span className="text-[#1FB6D5]">es tu plan operativo.</span></p>

              {/* Tipos de Evento */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">1. Tipos de evento</h3>
                <div className="grid gap-3">
                  <div className="bg-[#00344F]/30 border border-[#1FB6D5]/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="w-5 h-5 text-[#1FB6D5]" />
                      <span className="font-bold text-[#1FB6D5]">FERIADO</span>
                    </div>
                    <p className="text-slate-300 text-sm">Algo externo que mueve la demanda. Ej: feriados nacionales, fines de semana largos. Te sirve para decidir si abrís, con qué horario y con cuánta gente.</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="font-bold text-green-400">COMERCIAL</span>
                    </div>
                    <p className="text-slate-300 text-sm">Acción para vender más o mejor. Ej: San Valentín, Día del Amigo, Noche de Malbec. Ideas de promos, menús especiales y foco de venta.</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-600 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-5 h-5 text-slate-400" />
                      <span className="font-bold text-slate-300">INTERNO</span>
                    </div>
                    <p className="text-slate-300 text-sm">Cosas de puertas para adentro. Ej: inventarios, cambios de carta, reuniones. No traen gente, pero ordenan tu operación.</p>
                  </div>
                </div>
              </div>

              {/* Cómo leer las Notas */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">2. Cómo leer las Notas / Descripción</h3>
                <p className="text-slate-400 text-sm">Las notas están pensadas como pasos de acción, no como novela:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-[#1FB6D5] font-bold text-lg">H-72</div>
                    <div className="text-slate-400 text-xs">3 días antes</div>
                    <div className="text-slate-300 text-[10px] mt-1">Decisiones grandes</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-amber-400 font-bold text-lg">H-24</div>
                    <div className="text-slate-400 text-xs">Día anterior</div>
                    <div className="text-slate-300 text-[10px] mt-1">Ajustes finos</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-green-400 font-bold text-lg">Día D</div>
                    <div className="text-slate-400 text-xs">Mismo día</div>
                    <div className="text-slate-300 text-[10px] mt-1">Foco del servicio</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-purple-400 font-bold text-lg">Post</div>
                    <div className="text-slate-400 text-xs">Después</div>
                    <div className="text-slate-300 text-[10px] mt-1">Registrar aprendizajes</div>
                  </div>
                </div>
                <p className="text-[#1FB6D5] text-sm font-medium">👉 Si vas corto de tiempo: leé Título + Tipo + H-24 + Día D</p>
              </div>

              <div className="pt-4 flex justify-end border-t border-slate-700">
                <Button onClick={() => setShowGuide(false)} className="bg-[#1FB6D5] text-[#021019] hover:bg-white font-bold">
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
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-scale-in my-auto">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 rounded-t-2xl p-6 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-[#1FB6D5]" />
                <h2 className="text-xl font-bold text-white">{editMode ? 'Editar Evento' : 'Detalle del Evento'}</h2>
              </div>
              <button
                onClick={() => { setSelectedEvent(null); setEditMode(false); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
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
                    <label className="block text-sm text-slate-400 mb-1">Título</label>
                    <input
                      type="text"
                      value={editForm.titulo}
                      onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-[#1FB6D5] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Descripción / Notas</label>
                    <textarea
                      value={editForm.mensaje}
                      onChange={(e) => setEditForm({ ...editForm, mensaje: e.target.value })}
                      rows={6}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-[#1FB6D5] outline-none resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                      <select
                        value={editForm.tipo}
                        onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-[#1FB6D5] outline-none"
                      >
                        <option value="feriado">Feriado</option>
                        <option value="comercial">Comercial</option>
                        <option value="interno">Interno</option>
                        <option value="clima">Clima</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Prioridad</label>
                      <select
                        value={editForm.prioridad}
                        onChange={(e) => setEditForm({ ...editForm, prioridad: parseInt(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-[#1FB6D5] outline-none"
                      >
                        <option value={1}>Baja</option>
                        <option value={2}>Media</option>
                        <option value={3}>Alta</option>
                      </select>
                    </div>
                  </div>

                  {/* Negocios objetivo */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Negocios objetivo</label>
                    <p className="text-xs text-slate-500 mb-2">¿Para qué tipo de local aplica este evento?</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ALL_BUSINESS_TYPES.map((bt) => (
                        <label
                          key={bt}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${editForm.businessTypes.includes(bt)
                            ? 'bg-[#1FB6D5]/20 border-[#1FB6D5] text-white'
                            : 'bg-slate-950 border-slate-700 text-slate-400'
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
                            ? 'bg-[#1FB6D5] border-[#1FB6D5]'
                            : 'border-slate-600'
                            }`}>
                            {editForm.businessTypes.includes(bt) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                          <span className="text-sm font-medium">{BUSINESS_TYPE_LABELS[bt]}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Todas marcadas = evento general para todos los negocios
                    </p>
                  </div>
                </>
              ) : (
                // Read-Only View
                <>
                  <div className="flex items-center gap-3 mb-4">
                    {getEventIcon(selectedEvent.tipo)}
                    <span className="text-xs font-bold uppercase text-slate-400 bg-slate-800 px-2 py-1 rounded">
                      {selectedEvent.tipo?.replace('_', ' ')}
                    </span>
                    {getPriorityBadge(selectedEvent.prioridad)}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{selectedEvent.titulo}</h3>
                  <div className="bg-slate-950 border border-slate-700 rounded-lg p-4">
                    <p className="text-slate-300 whitespace-pre-wrap font-sans">{selectedEvent.description || selectedEvent.mensaje || 'Sin descripción.'}</p>
                  </div>
                  <div className="text-xs text-slate-500 mt-4 capitalize">
                    {new Date(selectedEvent.fecha_inicio.split('T')[0] + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {isAdmin && (
              <div className="p-6 border-t border-slate-700 flex justify-between">
                {editMode ? (
                  <>
                    <Button onClick={() => setEditMode(false)} variant="outline" className="border-slate-600 text-slate-300">
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveEvent} disabled={isSaving} className="bg-[#1FB6D5] text-[#021019] hover:bg-white font-bold">
                      <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleDeleteEvent} disabled={isSaving} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                    </Button>
                    <Button onClick={() => setEditMode(true)} className="bg-[#1FB6D5] text-[#021019] hover:bg-white font-bold">
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
