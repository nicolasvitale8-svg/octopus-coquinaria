
import React from 'react';
import Layout from '../components/Layout';
import { GASTRONOMIC_EVENTS, WHATSAPP_NUMBER } from '../constants';
import { Calendar as CalendarIcon, AlertTriangle, TrendingUp, Sun, ShoppingCart, Info, ArrowLeft, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { GastronomicEvent } from '../types';

const CalendarPage = () => {
  // Group events by Month
  const eventsByMonth = GASTRONOMIC_EVENTS.reduce((groups, event) => {
    const date = new Date(event.fecha_inicio);
    const monthKey = date.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(event);
    return groups;
  }, {} as Record<string, GastronomicEvent[]>);

  // Sort months logic could be added here, but assuming data comes somewhat sorted or we iterate keys
  // For simplicity in this demo, we rely on the object insertion order or sort keys manually if needed.
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'feriado_nacional':
      case 'feriado_local':
        return <CalendarIcon className="w-5 h-5 text-[#1FB6D5]" />;
      case 'clima':
        return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'precios_insumos':
      case 'proveedores':
        return <ShoppingCart className="w-5 h-5 text-red-400" />;
      case 'tendencia_consumo':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority === 3) return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-900/30 text-red-400 border border-red-900/50">Alta Prioridad</span>;
    if (priority === 2) return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-900/30 text-yellow-400 border border-yellow-900/50">Media</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">Baja</span>;
  };

  return (
    <Layout>
      <div className="bg-[#021019] min-h-screen py-12">
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
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
              <Button className="bg-[#1FB6D5] text-[#021019] hover:bg-white font-bold">
                 <MessageCircle className="w-4 h-4 mr-2" /> Sugerir un evento
              </Button>
            </a>
          </div>

          <div className="space-y-12">
            {Object.entries(eventsByMonth).map(([month, events]) => (
              <div key={month} className="animate-fade-in">
                <h2 className="text-2xl font-bold text-white mb-6 capitalize border-b border-slate-800 pb-2 font-space sticky top-24 bg-[#021019]/95 backdrop-blur py-2 z-10">
                  {month}
                </h2>
                
                <div className="grid grid-cols-1 gap-4">
                  {events.map((evt) => (
                    <div key={evt.id} className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-[#1FB6D5]/30 transition-all group relative overflow-hidden">
                       {/* Left accent border based on type */}
                       <div className={`absolute left-0 top-0 bottom-0 w-1 ${evt.prioridad === 3 ? 'bg-red-500' : (evt.prioridad === 2 ? 'bg-[#1FB6D5]' : 'bg-slate-700')}`}></div>
                       
                       <div className="flex flex-col md:flex-row gap-6">
                          {/* Date Block */}
                          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-[#00344F]/30 rounded-lg w-20 h-20 border border-slate-700">
                             <span className="text-xs text-slate-400 uppercase font-bold">Día</span>
                             <span className="text-2xl font-bold text-white font-mono">{new Date(evt.fecha_inicio).getDate()}</span>
                             {evt.fecha_inicio !== evt.fecha_fin && (
                               <span className="text-[10px] text-slate-500 font-mono">al {new Date(evt.fecha_fin).getDate()}</span>
                             )}
                          </div>

                          {/* Content */}
                          <div className="flex-grow">
                             <div className="flex flex-wrap items-center gap-3 mb-2">
                                {getPriorityBadge(evt.prioridad)}
                                <span className="flex items-center text-xs font-bold uppercase text-slate-400 tracking-wider bg-slate-800 px-2 py-0.5 rounded">
                                  {getEventIcon(evt.tipo)}
                                  <span className="ml-1">{evt.tipo.replace('_', ' ')}</span>
                                </span>
                             </div>
                             
                             {/* Parse message for title if simple format, or use title if structured */}
                             <h3 className="text-xl font-bold text-white mb-2">
                               {evt.mensaje ? evt.mensaje.split('·')[0].split(':')[1] || evt.mensaje : "Evento Gastronómico"}
                             </h3>
                             
                             <p className="text-slate-300 text-sm mb-3">
                               {evt.mensaje ? evt.mensaje.split('·')[1] : "Sin descripción adicional."}
                             </p>

                             {evt.prioridad >= 2 && (
                               <div className="bg-[#00344F]/20 p-3 rounded border border-[#1FB6D5]/20 flex items-start gap-3">
                                  <AlertTriangle className="w-4 h-4 text-[#1FB6D5] mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-[#1FB6D5] font-medium">
                                    Recomendación Octopus: Anticipar stock y reforzar personal.
                                  </p>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default CalendarPage;
