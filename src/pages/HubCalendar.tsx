
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { getEvents, createEvent, CalendarEvent } from '../services/calendarService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Info } from 'lucide-react';
import Button from '../components/ui/Button';

// Reuse UI components/logic from AdminCalendar but simplified/scoped
const HubCalendar = () => {
    const { user, profile } = useAuth();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventMsg, setNewEventMsg] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        const allEvents = await getEvents();
        // Filter: Global (no business_id) OR My Business (business_id matches user/profile)
        // Assumption: profile.id is the business identifier for now, or profile.business_id if we added it.
        // For 'Client' role, usually profile.id IS the link. Let's use profile.id as the "owner" of private events.

        const myEvents = allEvents.filter(e =>
            !e.business_id || e.business_id === profile?.id
        );
        setEvents(myEvents);
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !profile) return;

        await createEvent({
            title: newEventTitle,
            description: newEventMsg,
            start_date: format(selectedDate, 'yyyy-MM-dd'), // Local date fix
            end_date: format(selectedDate, 'yyyy-MM-dd'),
            type: 'interno', // Private events are usually internal
            business_id: profile.id // Tag as private!
        });

        setIsModalOpen(false);
        setNewEventTitle('');
        setNewEventMsg('');
        fetchEvents();
    };

    // Calendar Navigation
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
        <Layout>
            <div className="bg-[#050607] min-h-screen py-8 text-[var(--text-primary)]">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold font-space">Mi Calendario</h1>
                            <p className="text-[var(--text-muted)]">Eventos de Cephalopod + Tus Eventos Privados</p>
                        </div>
                        {/* Only Clients/Managers can add events */}
                        <Button onClick={() => { setSelectedDate(new Date()); setIsModalOpen(true); }} className="bg-[var(--color-primary)] text-black">
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Evento
                        </Button>
                    </div>

                    {/* Calendar Grid UI (Simplified from AdminCalendar) */}
                    <div className="bg-[var(--bg-base)] rounded-md border border-[var(--border-subtle)] p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold capitalize">
                                {format(currentDate, 'MMMM yyyy', { locale: es })}
                            </h2>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={prevMonth}><ChevronLeft /></Button>
                                <Button variant="ghost" onClick={nextMonth}><ChevronRight /></Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-px bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg overflow-hidden">
                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                                <div key={d} className="bg-[var(--bg-base)] p-4 text-center text-[var(--text-muted)] font-bold uppercase text-xs">
                                    {d}
                                </div>
                            ))}

                            {/* Empty cells for start padding would go here, skipping for brevity in this draft */}

                            {calendarDays.map(day => {
                                const dayEvents = events.filter(e => {
                                    // Robust Date Check
                                    if (!e.start_date) return false;
                                    const datePart = e.start_date.split('T')[0];
                                    return datePart === format(day, 'yyyy-MM-dd');
                                });
                                const isTodayDate = isToday(day);

                                return (
                                    <div
                                        key={day.toISOString()}
                                        onClick={() => { setSelectedDate(day); setIsModalOpen(true); }}
                                        className={`bg-[var(--bg-base)] min-h-[120px] p-2 hover:bg-[var(--bg-surface)] transition-colors cursor-pointer relative ${!isSameMonth(day, monthStart) ? 'opacity-30' : ''}`}
                                    >
                                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-2 ${isTodayDate ? 'bg-[var(--color-primary)] text-black' : 'text-[var(--text-muted)]'}`}>
                                            {format(day, 'd')}
                                        </span>

                                        <div className="space-y-1">
                                            {dayEvents.map(evt => (
                                                <div key={evt.id} className={`text-[10px] px-2 py-1 rounded border truncate
                                                    ${evt.business_id ? 'bg-[var(--bg-elevated)]/30 border-purple-500/50 text-purple-200' : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]'}
                                                `}>
                                                    {evt.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Logic would go here (Simplified) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[var(--bg-base)] p-6 rounded-md w-full max-w-md border border-[var(--border-subtle)]">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                            Nuevo Evento Privado ({selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''})
                        </h3>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="block text-[var(--text-muted)] mb-1">Título</label>
                                <input
                                    value={newEventTitle}
                                    onChange={e => setNewEventTitle(e.target.value)}
                                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-2 text-[var(--text-primary)]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[var(--text-muted)] mb-1">Detalle</label>
                                <textarea
                                    value={newEventMsg}
                                    onChange={e => setNewEventMsg(e.target.value)}
                                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-2 text-[var(--text-primary)]"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="bg-purple-600 hover:bg-[var(--color-primary)] text-[#050607]">Guardar Privado</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default HubCalendar;
