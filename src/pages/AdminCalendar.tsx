import React, { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X, Trash2, Clock } from 'lucide-react';
import { getEvents, createEvent, deleteEvent, CalendarEvent } from '../services/calendarService';
import { logger } from '../services/logger';
import Button from '../components/ui/Button';

// Tipos


const AdminCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    // Form State
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventType, setNewEventType] = useState<'feriado' | 'comercial' | 'interno'>('interno');
    const [newEventMsg, setNewEventMsg] = useState('');

    // --- Date Logic ---
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Comienza Lunes
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    // --- Data Fetching ---
    const fetchEvents = async () => {
        // 1. FAST: Load local
        const { getLocalEvents } = await import('../services/calendarService');
        const local = getLocalEvents();
        if (local.length > 0) {
            setEvents(local);
            setIsLoading(false);
        }

        // 2. SLOW: Fetch remote
        if (local.length === 0) setIsLoading(true);
        const data = await getEvents();
        logger.debug('AdminCalendar Fetched', { context: 'AdminCalendar', data: { count: data.length } });
        setEvents(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchEvents();
        // Trigger background sync to ensure local events are pushed to Supabase
        import('../services/calendarService').then(mod => mod.syncLocalEvents());
    }, [currentDate]);

    // --- Handlers ---
    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setEditingEvent(null); // Reset edit mode
        setNewEventTitle('');
        setNewEventType('interno');
        setNewEventMsg('');
        setIsModalOpen(true);
    };

    const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent prompting new event
        setEditingEvent(event);
        setSelectedDate(new Date(event.start_date));
        setNewEventTitle(event.title);
        setNewEventType(event.type);
        setNewEventMsg(event.description || '');
        setIsModalOpen(true);
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate) return;

        const { createEvent, updateEvent } = await import('../services/calendarService');

        if (editingEvent) {
            // Update existing
            await updateEvent({
                ...editingEvent,
                title: newEventTitle,
                type: newEventType,
                description: newEventMsg
            });
        } else {
            // Create new
            await createEvent({
                title: newEventTitle,
                type: newEventType,
                start_date: format(selectedDate, 'yyyy-MM-dd'),
                end_date: format(selectedDate, 'yyyy-MM-dd'),
                description: newEventMsg
            });
        }

        setIsModalOpen(false);
        setEditingEvent(null);
        fetchEvents();
    };

    const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Evitar abrir modal del día
        if (!confirm('¿Borrar este evento?')) return;

        await deleteEvent(id);
        fetchEvents();
    };

    // Helpers UI
    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'feriado': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'comercial': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-6 rounded-xl border border-slate-800">
                <div>
                    <h1 className="text-2xl font-bold text-white font-space flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-[#1FB6D5]" />
                        Calendario Comercial <span className="text-xs text-slate-600">(v2.2)</span>
                    </h1>
                    <p className="text-slate-400 text-sm">Gestiona fechas clave, feriados y eventos operativos.</p>
                </div>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-800 rounded-full text-slate-300">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-xl font-bold text-white w-40 text-center capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-slate-800 rounded-full text-slate-300">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/50">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 auto-rows-fr">
                    {calendarDays.map((day, dayIdx) => {
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const dayEvents = events.filter(e => {
                            // Robust Fix: Always take the YYYY-MM-DD part and force Local Midnight
                            // This ignores any time/zone info coming from DB (e.g. 2025-01-01T00:00:00Z -> 2025-01-01T00:00:00)
                            if (!e.start_date) return false;
                            const datePart = e.start_date.split('T')[0];
                            const localDateStr = `${datePart}T00:00:00`;
                            return isSameDay(new Date(localDateStr), day);
                        });
                        const isTodayDate = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => handleDayClick(day)}
                                className={`
                   min-h-[120px] p-2 border-b border-r border-slate-800 transition-colors cursor-pointer group hover:bg-slate-800/30
                   ${!isCurrentMonth ? 'bg-slate-950/30 text-slate-600' : 'bg-slate-900'}
                 `}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`
                     text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                     ${isTodayDate ? 'bg-[#1FB6D5] text-[#021019] font-bold' : 'text-slate-400'}
                   `}>
                                        {format(day, 'd')}
                                    </span>

                                    {/* Add Button visible on hover */}
                                    <button className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>

                                <div className="mt-2 space-y-1">
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            onClick={(e) => handleEventClick(event, e)}
                                            className={`text-[10px] px-1.5 py-1 rounded border truncate flex justify-between items-center group/event ${getEventTypeColor(event.type)} cursor-pointer hover:opacity-80`}
                                            title={event.title}
                                        >
                                            <span className="truncate">{event.title}</span>
                                            <button
                                                onClick={(e) => handleDeleteEvent(event.id, e)}
                                                className="opacity-0 group-hover/event:opacity-100 hover:text-red-300 ml-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add/Edit Event Modal */}
            {isModalOpen && selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h3 className="text-xl font-bold text-white">
                                {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}: <span className="text-[#1FB6D5]">{format(selectedDate, 'd MMMM', { locale: es })}</span>
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-[#1FB6D5] focus:outline-none"
                                    placeholder="Ej: Día de la Madre"
                                    value={newEventTitle}
                                    onChange={e => setNewEventTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo de Evento</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['feriado', 'comercial', 'interno'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setNewEventType(type as any)}
                                            className={`py-2 text-xs font-bold uppercase rounded border transition-all ${newEventType === type
                                                ? getEventTypeColor(type) + ' ring-1 ring-offset-1 ring-offset-slate-900'
                                                : 'bg-slate-950 border-slate-700 text-slate-500 hover:bg-slate-800'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Notas / Descripción</label>
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-[#1FB6D5] focus:outline-none h-24 resize-none"
                                    placeholder="Detalles adicionales..."
                                    value={newEventMsg}
                                    onChange={e => setNewEventMsg(e.target.value)}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400">
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-[#1FB6D5] text-[#021019] font-bold hover:bg-white">
                                    {editingEvent ? 'Guardar Cambios' : 'Crear Evento'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCalendar;
