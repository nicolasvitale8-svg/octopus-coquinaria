
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import { METHODOLOGY_7P, WHATSAPP_NUMBER, INSTAGRAM_URL, YOUTUBE_URL, BRAND_ILLUSTRATION_URL } from '../constants';
import {
  ArrowRight, Video, MessageCircle, AlertTriangle, Instagram,
  TrendingUp, TrendingDown, Activity, ShieldCheck, Zap,
  FileText, Play, LayoutTemplate, ClipboardList, GraduationCap
} from 'lucide-react';
import TickerGastronomico from '../components/TickerGastronomico';
import NewsBoard from '../components/NewsBoard';
import { getResources } from '../services/academyService';
import { AcademyResource } from '../types';



const Home = () => {
  const [imgError, setImgError] = useState(false);
  const [isOctopusMode, setIsOctopusMode] = useState(true);
  const [featuredResources, setFeaturedResources] = useState<AcademyResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);

  useEffect(() => {

    const loadResources = async () => {
      try {
        const all = await getResources();
        // Filtrar solo públicos o gratuitos y tomar los 3 primeros
        const filtered = all
          .filter(r => r.access === 'PUBLIC' || r.access === 'FREE')
          .slice(0, 3);
        setFeaturedResources(filtered);
      } catch (e) {
        console.error("Error loading home resources", e);
      } finally {
        setLoadingResources(false);
      }
    };
    loadResources();
  }, []);

  const getResourceIcon = (format: string) => {
    switch (format) {
      case 'VIDEO': return <Play size={16} />;
      case 'TEMPLATE': return <LayoutTemplate size={16} />;
      case 'TIP': return <Zap size={16} />;
      case 'FORM': return <ClipboardList size={16} />;
      default: return <FileText size={16} />;
    }
  };


  return (
    <Layout>
      <div className="relative overflow-hidden min-h-[90vh] flex items-center">

        {/* DESKTOP OCTOPUS IMAGE: Absolute positioning relative to SCREEN (viewport), not container */}
        <div className="hidden lg:block absolute top-1/2 right-0 -translate-y-1/2 h-[95vh] w-[50vw] translate-x-12 z-10 pointer-events-none">
          {/* Decorative Glow behind Octopus */}
          <div className="absolute top-1/2 left-[60%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-[#00344F]/40 rounded-full blur-[80px] -z-10 animate-pulse"></div>

          {BRAND_ILLUSTRATION_URL && !imgError ? (
            <img
              src={BRAND_ILLUSTRATION_URL}
              alt="Octopus Illustration"
              className="w-full h-full object-contain object-right drop-shadow-2xl opacity-100"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-end pr-10">
              <svg viewBox="0 0 500 500" className="h-[80%] w-auto text-[#00344F] opacity-90 drop-shadow-2xl">
                <defs>
                  <filter id="engraving">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                    <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 5 -2" in="noise" result="texture" />
                  </filter>
                </defs>
                <path d="M250,100 C300,100 350,140 350,200 C350,280 300,300 250,320 C200,300 150,280 150,200 C150,140 200,100 250,100 Z" fill="currentColor" opacity="0.8" />
                <path d="M250,320 Q300,350 350,450" stroke="currentColor" strokeWidth="20" fill="none" strokeLinecap="round" />
                <path d="M250,320 Q200,350 150,450" stroke="currentColor" strokeWidth="20" fill="none" strokeLinecap="round" />
                <path d="M350,200 Q400,200 450,150" stroke="currentColor" strokeWidth="15" fill="none" strokeLinecap="round" />
                <path d="M150,200 Q100,200 50,150" stroke="currentColor" strokeWidth="15" fill="none" strokeLinecap="round" />
                <circle cx="220" cy="220" r="15" fill="#1FB6D5" opacity="0.8" />
                <circle cx="280" cy="220" r="15" fill="#1FB6D5" opacity="0.8" />
              </svg>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full h-full flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">

            {/* Left Column: Text & CTA */}
            <div className="text-left order-2 lg:order-1 relative z-20 max-w-2xl">
              <div className="flex gap-4 mb-8">
                <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-red-500 transition-colors bg-white/5 p-2 rounded-full" title="YouTube">
                  <Video className="w-5 h-5" />
                </a>
                <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-pink-500 transition-colors bg-white/5 p-2 rounded-full" title="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-green-500 transition-colors bg-white/5 p-2 rounded-full" title="WhatsApp">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>

              <div className="mb-2">
                <span className="text-[#1FB6D5] font-bold tracking-widest uppercase text-xs border border-[#1FB6D5]/30 px-3 py-1 rounded bg-[#1FB6D5]/10">
                  Octopus Coquinaria
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#F9F7F4] tracking-tight mb-8 font-space leading-[1.1]">
                Tu restaurante <br /> no necesita más ideas. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1FB6D5] to-blue-500">Necesita control.</span>
              </h1>

              <p className="text-xl text-slate-300 mb-10 max-w-lg leading-relaxed font-light">
                <span className="animate-faulty-flicker inline-block text-[#D64747] font-bold mr-1">Si tu Excel da miedo</span>, estás en el lugar correcto.
                Transformamos el caos operativo en <span className="animate-shine font-bold text-white">rentabilidad medible</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-5">
                <Link to="/quick-diagnostic">
                  <Button size="lg" className="w-full sm:w-auto shadow-[0_0_20px_rgba(31,182,213,0.3)] border border-[#1FB6D5]/20 bg-[#1FB6D5] text-[#021019] hover:bg-white hover:text-[#021019] font-bold">
                    Hacer diagnóstico rápido (5 min)
                  </Button>
                </Link>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Hablar por WhatsApp
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column: MOBILE ONLY Image */}
            <div className="order-1 lg:hidden flex justify-center items-center relative mb-8">
              <div className="w-[80%] max-w-[400px]">
                {BRAND_ILLUSTRATION_URL && !imgError ? (
                  <img
                    src={BRAND_ILLUSTRATION_URL}
                    alt="Octopus Illustration"
                    className="w-full h-auto opacity-100 drop-shadow-2xl"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <svg viewBox="0 0 500 500" className="w-full h-auto text-[#00344F] opacity-90">
                    <path d="M250,100 C300,100 350,140 350,200 C350,280 300,300 250,320 C200,300 150,280 150,200 C150,140 200,100 250,100 Z" fill="currentColor" opacity="0.8" />
                    <circle cx="220" cy="220" r="15" fill="#1FB6D5" opacity="0.8" />
                    <circle cx="280" cy="220" r="15" fill="#1FB6D5" opacity="0.8" />
                  </svg>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* TICKER GASTRONÓMICO */}
      <TickerGastronomico />

      {/* Methodology Summary - Dark */}
      <div className="bg-[#000d14]/80 backdrop-blur-sm py-24 border-t border-slate-900 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 font-space text-white">Los 7 Pilares <span className="text-[#1FB6D5]">OCTOPUS</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Nuestro marco de trabajo para ordenar cualquier negocio gastronómico, desde un foodtruck hasta un hotel.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {METHODOLOGY_7P.map((item, idx) => (
              <div key={item.id} className="bg-[#021019]/80 p-6 rounded-lg border border-slate-800 hover:border-[#1FB6D5] transition-all group shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 rounded-full bg-[#00344F] group-hover:bg-[#1FB6D5] group-hover:text-[#021019] flex items-center justify-center text-xl font-bold text-[#1FB6D5] transition-colors border border-white/10">
                    {item.key}
                  </span>
                  <h3 className="text-lg font-bold text-white font-space">{item.letter}</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4 italic min-h-[40px]">"{item.tagline}"</p>
                <div className="bg-[#000]/50 p-3 rounded border border-slate-800 mb-4">
                  <p className="text-xs text-[#D64747] flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {item.symptoms[0]}
                  </p>
                </div>
                <Link to="/methodology" className="text-[#1FB6D5] text-xs font-bold hover:text-white flex items-center">
                  Ver cómo lo trabajamos <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NEWS BOARD */}
      <NewsBoard />

      {/* Benefits / Results - Chaos vs Octopus Toggle */}
      <div className={`py-24 border-t transition-all duration-1000 relative overflow-hidden z-20 ${isOctopusMode
        ? 'bg-[#001a2c] border-slate-900'
        : 'bg-[#0a0505] border-red-900/30'
        }`}>
        {/* Pattern overlay */}
        <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] transition-opacity duration-1000 ${isOctopusMode ? 'opacity-10' : 'opacity-20 flex grayscale invert'
          }`}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* SECLECTOR DE MODO */}
          <div className="flex flex-col items-center mb-16">
            <h3 className="text-white font-space text-xs tracking-[0.3em] uppercase mb-6 opacity-30">Visualizador de Impacto Octopus</h3>
            <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-full border border-slate-800 backdrop-blur-md shadow-2xl">
              <button
                onClick={() => setIsOctopusMode(false)}
                className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all duration-500 ${!isOctopusMode
                  ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                Operación Caos
              </button>
              <button
                onClick={() => setIsOctopusMode(true)}
                className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all duration-500 ${isOctopusMode
                  ? 'bg-[#1FB6D5] text-[#021019] shadow-[0_0_20px_rgba(31,182,213,0.5)]'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                Método Octopus
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center items-start">
            {/* Metric 1 */}
            <div className={`group transition-all duration-700 transform ${!isOctopusMode ? 'scale-100' : 'scale-100'}`}>
              <div className={`text-6xl font-black mb-4 font-mono transition-all duration-700 ${isOctopusMode ? 'text-white' : 'text-red-500/80 text-5xl italic translate-y-2'}`}>
                {isOctopusMode ? '–7 pts' : '+38%'}
              </div>
              <div className={`flex items-center justify-center gap-2 mb-4 transition-colors duration-700 ${isOctopusMode ? 'text-[#1FB6D5]' : 'text-red-700'}`}>
                {isOctopusMode ? <TrendingDown size={20} /> : <Activity size={20} className="animate-pulse" />}
                <span className="font-bold uppercase tracking-widest text-[10px]">
                  {isOctopusMode ? 'Costo Mercadería' : 'Fugas de Stock'}
                </span>
              </div>
              <p className={`text-xs leading-relaxed transition-colors duration-700 ${isOctopusMode ? 'text-cyan-200/50' : 'text-slate-400 italic'}`}>
                {isOctopusMode
                  ? 'Reducción directa al implementar ingeniería de menú y control de compras.'
                  : 'Pérdidas constantes por falta de procesos y recetas estandarizadas.'}
              </p>
            </div>

            {/* Metric 2 */}
            <div className={`group transition-all duration-700 transform md:border-l md:border-r border-white/10 ${!isOctopusMode ? 'scale-100' : 'scale-100'}`}>
              <div className={`text-6xl font-black mb-4 font-mono transition-all duration-700 ${isOctopusMode ? 'text-white' : 'text-red-500/80 text-5xl italic translate-y-2'}`}>
                {isOctopusMode ? '+18%' : 'Estancado'}
              </div>
              <div className={`flex items-center justify-center gap-2 mb-4 transition-colors duration-700 ${isOctopusMode ? 'text-[#1FB6D5]' : 'text-red-700'}`}>
                {isOctopusMode ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                <span className="font-bold uppercase tracking-widest text-[10px]">
                  {isOctopusMode ? 'Venta x Cubierto' : 'Ticket Promedio'}
                </span>
              </div>
              <p className={`text-xs px-4 leading-relaxed transition-colors duration-700 ${isOctopusMode ? 'text-cyan-200/50' : 'text-slate-400 italic'}`}>
                {isOctopusMode
                  ? 'Incremento logrado mediante capacitación de salón y arquitectura web.'
                  : 'Sin estrategia de up-selling ni optimización de rotación de mesas.'}
              </p>
            </div>

            {/* Metric 3 */}
            <div className={`group transition-all duration-700 transform ${!isOctopusMode ? 'scale-100' : 'scale-100'}`}>
              <div className={`text-6xl font-black mb-4 font-mono transition-all duration-700 ${isOctopusMode ? 'text-white' : 'text-red-500/80 text-5xl italic translate-y-2'}`}>
                {isOctopusMode ? '0' : 'Incierto'}
              </div>
              <div className={`flex items-center justify-center gap-2 mb-4 transition-colors duration-700 ${isOctopusMode ? 'text-[#1FB6D5]' : 'text-red-700'}`}>
                {isOctopusMode ? <ShieldCheck size={20} /> : <AlertTriangle size={20} className="animate-bounce" />}
                <span className="font-bold uppercase tracking-widest text-[10px]">
                  {isOctopusMode ? 'Errores Operativos' : 'Caos Diario'}
                </span>
              </div>
              <p className={`text-xs leading-relaxed transition-colors duration-700 ${isOctopusMode ? 'text-cyan-200/50' : 'text-slate-400 italic'}`}>
                {isOctopusMode
                  ? 'Continuidad operativa garantizada. Dueños con tiempo libre real.'
                  : 'Compras reactivas de último momento que matan el margen neto.'}
              </p>
            </div>
          </div>

          <div className="mt-20 text-center relative max-w-4xl mx-auto">
            <div className={`absolute inset-0 bg-[#1FB6D5]/5 blur-3xl rounded-full transition-opacity duration-1000 ${isOctopusMode ? 'opacity-100' : 'opacity-0'}`}></div>
            <div className={`relative z-10 p-10 md:p-14 rounded-[3rem] border transition-all duration-1000 ${isOctopusMode
              ? 'bg-[#021019] border-[#1FB6D5]/30 shadow-[0_0_50px_rgba(31,182,213,0.15)]'
              : 'bg-black/50 border-red-900/10 grayscale'
              }`}>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-8 font-space">
                {isOctopusMode ? '¿Querés saber dónde estás parado?' : '¿Hasta cuándo vas a trabajar así?'}
              </h3>
              <div className="flex flex-col sm:flex-row justify-center gap-5">
                <Link to="/quick-diagnostic">
                  <Button className={`py-4 px-10 text-lg font-bold transition-all duration-700 shadow-2xl ${isOctopusMode
                    ? 'bg-[#1FB6D5] text-[#021019] hover:bg-white'
                    : 'bg-red-600 text-white hover:bg-white hover:text-red-600'
                    }`}>
                    {isOctopusMode ? 'Comenzar autodiagnóstico' : 'Detectar mis fugas hoy'}
                  </Button>
                </Link>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Me%20gustar%C3%ADa%20agendar%20una%20videollamada%20para%20mi%20negocio`} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                  <Button variant="outline" className="py-4 px-10 text-lg border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white w-full rounded-xl">Agendar videollamada</Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECURSOS GRATUITOS - SECCIÓN FUNCIONAL */}
      {!loadingResources && featuredResources.length > 0 && (
        <div className="bg-[#021019] py-24 border-t border-slate-900 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-12 bg-[#1FB6D5]"></div>
                  <span className="text-[#1FB6D5] font-black text-xs uppercase tracking-[0.3em]">Biblioteca Gratuita</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white font-space mb-6 leading-tight">
                  Recursos para <br />
                  <span className="text-[#1FB6D5] italic font-light">Empezar Hoy</span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Herramientas y guías prácticas de la metodología Octopus que podés aplicar ahora mismo en tu negocio sin costo.
                </p>
              </div>
              <Link to="/academy" className="mb-2">
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/10 text-white hover:border-[#1FB6D5] hover:text-[#1FB6D5] font-bold uppercase tracking-widest text-xs">
                  Explorar Academia <ArrowRight className="ml-3 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredResources.map((res) => (
                <div
                  key={res.id}
                  className="group relative flex flex-col h-full bg-[#031521] border-white/5 border rounded-[2.5rem] p-10 transition-all duration-500 hover:bg-[#041d2d] hover:border-[#1FB6D5]/30 hover:-translate-y-2 overflow-hidden shadow-2xl"
                >
                  {/* Glow effect */}
                  <div className="absolute -right-20 -top-20 w-40 h-40 bg-[#1FB6D5]/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#1FB6D5]/10 flex items-center justify-center text-[#1FB6D5] group-hover:scale-110 transition-transform duration-500">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                  </div>

                  <div className="flex-grow space-y-4 mb-10">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      {res.category} • {res.format}
                    </div>
                    <h3 className="text-2xl font-bold text-white font-space leading-tight group-hover:text-[#1FB6D5] transition-colors line-clamp-2">
                      {res.title}
                    </h3>
                    <p className="text-slate-400 text-base leading-relaxed line-clamp-3">
                      {res.outcome}
                    </p>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Open Resource</span>
                    <Link to={`/academy/${res.id}`} className="text-[#1FB6D5] text-xs font-black uppercase tracking-widest hover:text-white flex items-center gap-2 group/btn">
                      Comenzar <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Home;
