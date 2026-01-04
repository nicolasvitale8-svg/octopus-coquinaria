
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { NICOLAS_PHOTO_URL, LINKEDIN_URL, WHATSAPP_NUMBER } from '../constants';
import Button from '../components/ui/Button';
import { MessageCircle, Linkedin, CheckCircle, Target, Search, Settings, Zap, BarChart2, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <Layout>
      <div className="bg-[#021019] min-h-screen pt-8 pb-12 md:pb-20 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#00344F]/20 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-slate-500 hover:text-[#1FB6D5] transition-colors text-sm font-bold uppercase tracking-widest group">
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Volver al Inicio
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left Column: Photo */}
            <div className="order-2 lg:order-1 flex justify-center lg:justify-end">
              <div className="relative">
                {/* Photo Frame */}
                <div className="w-[300px] h-[400px] md:w-[400px] md:h-[500px] bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 relative z-10">
                  {NICOLAS_PHOTO_URL && !imgError ? (
                    <img
                      src={NICOLAS_PHOTO_URL}
                      alt="Nicolás Vitale"
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center flex-col text-slate-600">
                      <span className="text-6xl font-space font-bold opacity-20">NV</span>
                      <span className="text-sm mt-4 uppercase tracking-widest opacity-50">Foto de Perfil</span>
                    </div>
                  )}
                </div>
                {/* Decorative Frame Border */}
                <div className="absolute top-6 -left-6 w-full h-full border-2 border-[#1FB6D5]/30 rounded-2xl -z-0"></div>

                {/* Tentacle decoration (simulated) */}
                <svg className="absolute -bottom-20 -left-20 w-64 h-64 text-[#00344F] opacity-30 z-20" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M20,100 Q40,50 90,80 T100,20" stroke="currentColor" strokeWidth="8" fill="none" />
                  <path d="M10,90 Q30,60 80,90" stroke="currentColor" strokeWidth="6" fill="none" />
                </svg>
              </div>
            </div>

            {/* Right Column: Text */}
            <div className="order-1 lg:order-2 text-left">
              <h1 className="text-5xl font-extrabold text-[#F9F7F4] font-space mb-2">
                Quién está detrás de Octopus
              </h1>
              <h2 className="text-xl text-[#1FB6D5] font-semibold mb-8 font-mono">
                Nicolás Vitale — Gestión operativa & control
              </h2>

              <div className="space-y-6 text-slate-300 text-lg leading-relaxed font-light">
                <p>
                  Soy Nicolás Vitale, especialista en gestión operativa y control gastronómico.
                  Trabajo para que los negocios dejen de sobrevivir al día a día y empiecen a tomar decisiones con números reales.
                </p>
                <p>
                  Pasé por cocina, salón, barras, producción, compras, proveedores y dirección operativa.
                  Esa mezcla me dio una obsesión saludable: ordenar, medir y simplificar para que el negocio funcione incluso cuando vos no estás.
                </p>
                <p>
                  En Octopus aplico el modelo <span className="text-white font-bold">7P</span> —Orden, Creatividad, Tecnología, Observación, Pragmatismo, Universalidad y Sutileza— para transformar caos operativo en rentabilidad medible.
                </p>
                <p className="border-l-4 border-[#1FB6D5] pl-6 italic text-white/80">
                  No vendo magia. No vendo tendencias. Vendo sistemas que funcionan, procesos que se cumplen y números que se entienden.
                </p>
              </div>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
                  <Button size="lg" className="bg-[#1FB6D5] text-[#021019] hover:bg-white font-bold">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Hablar con Nicolás
                  </Button>
                </a>
                <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="lg" className="border-[#1FB6D5] text-[#1FB6D5] hover:bg-[#1FB6D5] hover:text-[#021019]">
                    <Linkedin className="w-5 h-5 mr-2" />
                    Ver LinkedIn
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Experience Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-24">
            <div className="bg-[#00344F]/40 p-8 rounded-2xl border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-6 font-space">Experiencia Real</h3>
              <ul className="space-y-4">
                {[
                  "Dirección y operación de proyectos gastronómicos.",
                  "Implementación de procesos de cocina y salón.",
                  "Diseño de costos y control de stock.",
                  "Liderazgo de equipos de alta rotación.",
                  "Negociación con proveedores y logística."
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-slate-300">
                    <CheckCircle className="w-5 h-5 text-[#1FB6D5] mr-3 mt-1 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#00344F]/40 p-8 rounded-2xl border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-6 font-space">Qué hago hoy</h3>
              <ul className="space-y-4">
                {[
                  "Diagnóstico financiero y operativo.",
                  "Diseño de manuales de procedimiento (SOP).",
                  "Auditorías de servicio y producto.",
                  "Capacitación de equipos y mandos medios.",
                  "Implementación de tableros de control."
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-slate-300">
                    <Target className="w-5 h-5 text-[#1FB6D5] mr-3 mt-1 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* How I Work */}
          <div className="mt-20 text-center max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-10 font-space">Cómo trabajo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
                <Settings className="w-8 h-8 text-[#1FB6D5] mx-auto mb-3" />
                <h4 className="font-bold text-white mb-1">Orden</h4>
                <p className="text-xs text-slate-400">Primero ordenamos la casa, después crecemos.</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
                <BarChart2 className="w-8 h-8 text-[#1FB6D5] mx-auto mb-3" />
                <h4 className="font-bold text-white mb-1">Tecnología</h4>
                <p className="text-xs text-slate-400">Datos primero, opiniones después.</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
                <Search className="w-8 h-8 text-[#1FB6D5] mx-auto mb-3" />
                <h4 className="font-bold text-white mb-1">Observación</h4>
                <p className="text-xs text-slate-400">Auditamos antes de tocar nada.</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
                <Zap className="w-8 h-8 text-[#1FB6D5] mx-auto mb-3" />
                <h4 className="font-bold text-white mb-1">Pragmatismo</h4>
                <p className="text-xs text-slate-400">Solo acciones que mueven la aguja.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default About;
