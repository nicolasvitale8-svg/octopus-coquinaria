import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Calendar, Play, Pause } from 'lucide-react';
import { Link } from 'react-router-dom';

const TickerGastronomico = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [activeEvents, setActiveEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchTickerEvents = async () => {
      if (!supabase) return;

      // Fetch active events from DB
      const todayStr = new Date().toISOString().split('T')[0];

      // Logic: Get events that started before/on today and end after/on today
      // OR simplified for now: just get all future or recent events to scroll
      const { data, error } = await supabase
        .from('eventos_calendario')
        .select('*')
        .gte('fecha_fin', todayStr)
        .order('fecha_inicio', { ascending: true })
        .order('prioridad', { ascending: false })
        .limit(15);

      if (data && data.length > 0) {
        setActiveEvents(data);
      }
    };

    fetchTickerEvents();
  }, []);

  if (activeEvents.length === 0) return null;

  return (
    <div className="w-full bg-black border-t border-b border-[var(--border-subtle)] h-12 flex items-center relative overflow-hidden z-30">

      {/* Label (Desktop only) */}
      <div className="hidden md:flex items-center h-full px-4 bg-black z-20 shadow-[5px_0_10px_rgba(0,0,0,0.5)] border-r border-[var(--border-subtle)]">
        <span className="text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-3 h-3" />
          Calendario Octopus
        </span>
      </div>

      {/* Scrolling Container */}
      <div
        className="flex-1 overflow-hidden relative h-full flex items-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={`animate-marquee flex items-center gap-12 px-4 ${isPaused ? 'paused' : ''}`}
          style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
        >
          {activeEvents.map((evt) => (
            <div key={evt.id} className="flex items-center text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] mr-3"></span>
              <span className="mr-2">
                {/* Highlight the date part if present (before the colon) */}
                {evt.mensaje?.includes(':') ? (
                  <>
                    <span className="text-[var(--color-primary)] font-bold">{evt.mensaje.split(':')[0]}:</span>
                    {evt.mensaje.split(':')[1]}
                  </>
                ) : (
                  evt.mensaje
                )}
              </span>
            </div>
          ))}
          {/* Duplicate for seamless loop effect (optional, though CSS marquee does 100% to -100%) */}
          {activeEvents.map((evt) => (
            <div key={`${evt.id}-dup`} className="flex items-center text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] mr-3"></span>
              <span className="mr-2">
                {evt.mensaje?.includes(':') ? (
                  <>
                    <span className="text-[var(--color-primary)] font-bold">{evt.mensaje.split(':')[0]}:</span>
                    {evt.mensaje.split(':')[1]}
                  </>
                ) : (
                  evt.mensaje
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center h-full px-4 bg-black z-20 shadow-[-5px_0_10px_rgba(0,0,0,0.5)] border-l border-[var(--border-subtle)]">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
          title={isPaused ? "Reanudar" : "Pausar"}
        >
          {isPaused ? <Play className="w-3 h-3" fill="currentColor" /> : <Pause className="w-3 h-3" fill="currentColor" />}
        </button>
        <Link to="/calendar" className="hidden sm:block ml-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] hover:text-[var(--text-primary)] transition-colors">
          Ver calendario completo
        </Link>
      </div>

    </div>
  );
};

export default TickerGastronomico;
