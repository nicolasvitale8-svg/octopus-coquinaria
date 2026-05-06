
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
      <div className="bg-[#050607] min-h-screen pt-8 pb-12 md:pb-20 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#0F1416]/20 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors text-sm font-bold uppercase tracking-widest group">
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Volver al Inicio
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left Column: Photo */}
            <div className="order-2 lg:order-1 flex justify-center lg:justify-end">
              <div className="relative">
                {/* Photo Frame */}
                <div className="w-[300px] h-[400px] md:w-[400px] md:h-[500px] bg-[var(--bg-surface)] rounded-md overflow-hidden shadow-2xl border border-[var(--border-subtle)] relative z-10">
                  {NICOLAS_PHOTO_URL && !imgError ? (
                    <img
                      src={NICOLAS_PHOTO_URL}
                      alt="Nicolás Vitale"
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--bg-surface)] flex items-center justify-center flex-col text-[var(--text-muted)]">
                      <span className="text-6xl font-space font-bold opacity-20">NV</span>
                      <span className="text-sm mt-4 uppercase tracking-widest opacity-50">Foto de Perfil</span>
                    </div>
                  )}
                </div>
                {/* Decorative Frame Border */}
                <div className="absolute top-6 -left-6 w-full h-full border-2 border-[var(--color-primary)]/30 rounded-md -z-0"></div>

                {/* Tentacle decoration (simulated) */}
                <svg className="absolute -bottom-20 -left-20 w-64 h-64 text-[#0F1416] opacity-30 z-20" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M20,100 Q40,50 90,80 T100,20" stroke="currentColor" strokeWidth="8" fill="none" />
                  <path d="M10,90 Q30,60 80,90" stroke="currentColor" strokeWidth="6" fill="none" />
                </svg>
              </div>
            </div>

            {/* Right Column: Text */}
            <div className="order-1 lg:order-2 text-left">
              <h1 className="text-5xl font-extrabold text-[#E6E8E5] font-space mb-2">
                Quién está detrás de Cephalopod
              </h1>
              <h2 className="text-xl text-[var(--color-primary)] font-semibold mb-8 font-mono">
                Nicolás Vitale — Gestión operativa & control
              </h2>

              <div className="space-y-6 text-[var(--text-secondary)] text-lg leading-relaxed font-light">
                <p>
                  Soy Nicolás Vitale, especialista en gestión operativa y control gastronómico.
                  Trabajo para que los negocios dejen de sobrevivir al día a día y empiecen a tomar decisiones con números reales.
                </p>
                <p>
                  Pasé por cocina, salón, barras, producción, compras, proveedores y dirección operativa.
                  Esa mezcla me dio una obsesión saludable: ordenar, medir y simplificar para que el negocio funcione incluso cuando vos no estás.
                </p>
                <p>
                  En Cephalopod aplico el modelo <span className="text-[var(--text-primary)] font-bold">7P</span> —Orden, Creatividad, Tecnología, Observación, Pragmatismo, Universalidad y Sutileza— para transformar caos operativo en rentabilidad medible.
                </p>
                <p className="border-l-4 border-[var(--color-primary)] pl-6 italic text-[var(--text-primary)]/80">
                  No vendo magia. No vendo tendencias. Vendo sistemas que funcionan, procesos que se cumplen y números que se entienden.
                </p>
              </div>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
                  <Button size="lg" className="bg-[var(--color-primary)] text-[#050607] hover:bg-white font-bold">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Hablar con Nicolás
                  </Button>
                </a>
                <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="lg" className="border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[#050607]">
                    <Linkedin className="w-5 h-5 mr-2" />
                    Ver LinkedIn
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Experience Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-24">
            <div className="bg-[#0F1416]/40 p-8 rounded-md border border-[var(--border-subtle)]">
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6 font-space">Experiencia Real</h3>
              <ul className="space-y-4">
                {[
                  "Dirección y operación de proyectos gastronómicos.",
                  "Implementación de procesos de cocina y salón.",
                  "Diseño de costos y control de stock.",
                  "Liderazgo de equipos de alta rotación.",
                  "Negociación con proveedores y logística."
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-[var(--text-secondary)]">
                    <CheckCircle className="w-5 h-5 text-[var(--color-primary)] mr-3 mt-1 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0F1416]/40 p-8 rounded-md border border-[var(--border-subtle)]">
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6 font-space">Qué hago hoy</h3>
              <ul className="space-y-4">
                {[
                  "Diagnóstico financiero y operativo.",
                  "Diseño de manuales de procedimiento (SOP).",
                  "Auditorías de servicio y producto.",
                  "Capacitación de equipos y mandos medios.",
                  "Implementación de tableros de control."
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-[var(--text-secondary)]">
                    <Target className="w-5 h-5 text-[var(--color-primary)] mr-3 mt-1 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* How I Work */}
          <div className="mt-20 text-center max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-10 font-space">Cómo trabajo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]/50">
                <Settings className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-3" />
                <h4 className="font-bold text-[var(--text-primary)] mb-1">Orden</h4>
                <p className="text-xs text-[var(--text-muted)]">Primero ordenamos la casa, después crecemos.</p>
              </div>
              <div className="p-4 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]/50">
                <BarChart2 className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-3" />
                <h4 className="font-bold text-[var(--text-primary)] mb-1">Tecnología</h4>
                <p className="text-xs text-[var(--text-muted)]">Datos primero, opiniones después.</p>
              </div>
              <div className="p-4 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]/50">
                <Search className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-3" />
                <h4 className="font-bold text-[var(--text-primary)] mb-1">Observación</h4>
                <p className="text-xs text-[var(--text-muted)]">Auditamos antes de tocar nada.</p>
              </div>
              <div className="p-4 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]/50">
                <Zap className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-3" />
                <h4 className="font-bold text-[var(--text-primary)] mb-1">Pragmatismo</h4>
                <p className="text-xs text-[var(--text-muted)]">Solo acciones que mueven la aguja.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default About;
