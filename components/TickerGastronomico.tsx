
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

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
        //.lte('fecha_inicio', todayStr) -- This might be too restrictive if data is sparse
        //.gte('fecha_fin', todayStr)
        .order('prioridad', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        setActiveEvents(data);
      } else {
        // Fallback to constants if DB is empty to show something
        // (Optional, maybe specific "Welcome" event)
      }
    };

    fetchTickerEvents();
  }, []);

  if (activeEvents.length === 0) return null;

  return (
    <div className="w-full bg-black border-t border-b border-slate-800 h-12 flex items-center relative overflow-hidden z-30">

      {/* Label (Desktop only) */}
      <div className="hidden md:flex items-center h-full px-4 bg-black z-20 shadow-[5px_0_10px_rgba(0,0,0,0.5)] border-r border-slate-800">
        <span className="text-[#1FB6D5] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
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
            <div key={evt.id} className="flex items-center text-sm font-medium text-slate-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#1FB6D5] mr-3"></span>
              <span className="mr-2">
                {/* Highlight the date part if present (before the colon) */}
                {evt.mensaje?.includes(':') ? (
                  <>
                    <span className="text-[#1FB6D5] font-bold">{evt.mensaje.split(':')[0]}:</span>
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
            <div key={`${evt.id}-dup`} className="flex items-center text-sm font-medium text-slate-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#1FB6D5] mr-3"></span>
              <span className="mr-2">
                {evt.mensaje?.includes(':') ? (
                  <>
                    <span className="text-[#1FB6D5] font-bold">{evt.mensaje.split(':')[0]}:</span>
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
      <div className="flex items-center h-full px-4 bg-black z-20 shadow-[-5px_0_10px_rgba(0,0,0,0.5)] border-l border-slate-800">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="text-slate-400 hover:text-white transition-colors p-1"
          title={isPaused ? "Reanudar" : "Pausar"}
        >
          {isPaused ? <Play className="w-3 h-3" fill="currentColor" /> : <Pause className="w-3 h-3" fill="currentColor" />}
        </button>
        <Link to="/calendar" className="hidden sm:block ml-4 text-[10px] font-bold uppercase tracking-wider text-[#1FB6D5] hover:text-white transition-colors">
          Ver calendario completo
        </Link>
      </div>

    </div>
  );
};

export default TickerGastronomico;
