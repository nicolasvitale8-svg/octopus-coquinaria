

import React from 'react';
import Layout from '../components/Layout';
import { WHATSAPP_NUMBER, COLIFA_MENU_URL, TECHNICAL_SHEETS_EXAMPLE_URL, PROCESS_EXAMPLE_URL } from '../constants';
import Button from '../components/ui/Button';
import { CheckCircle, ArrowRight, Star, TrendingUp, Settings, BarChart2, Users, Layers, Zap, Download, ExternalLink, FileText, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Services = () => {
  return (
    <Layout>
      <div className="bg-[#021019] min-h-screen pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-slate-500 hover:text-[#1FB6D5] transition-colors text-sm font-bold uppercase tracking-widest group">
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Volver al Inicio
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 font-space">
              Casos y <span className="text-[#1FB6D5]">Servicios</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Resultados medibles y soluciones basadas en metodología 7P.
            </p>
          </div>

          {/* SECCIÓN 1: CASOS */}
          <div className="mb-24">
            <h2 className="text-2xl font-bold text-white mb-8 border-l-4 border-[#1FB6D5] pl-4 font-space flex items-center">
              <Star className="w-6 h-6 text-[#1FB6D5] mr-3" />
              Casos de Éxito
            </h2>

            <div className="space-y-12">

              {/* Caso 1: Serranitos */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl hover:border-[#1FB6D5]/30 transition-all">
                <div className="p-8 md:p-10">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-6">
                    <div>
                      <h3 className="text-3xl font-bold text-white font-space mb-2">Los Serranitos</h3>
                      <span className="inline-block bg-[#00344F] text-[#1FB6D5] text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">
                        Reapertura & Ordenamiento
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <h4 className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-3">El Desafío</h4>
                      <p className="text-slate-300 mb-6">
                        Negocio con alta demanda esperada, pero sin estructura operativa sólida, sin procesos formales ni criterios de control.
                      </p>

                      <h4 className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-3">Intervención Octopus</h4>
                      <ul className="space-y-2 mb-6">
                        {[
                          "Diseño de flujo operativo y organización de sectores.",
                          "Diseño de carta completa y selección de proveedores.",
                          "Checklists de apertura, cierre y limpieza.",
                          "Implementación de sistema Mr. Comanda.",
                          "Control de compras y costos mensual."
                        ].map((item, i) => (
                          <li key={i} className="flex items-start text-sm text-slate-300">
                            <CheckCircle className="w-4 h-4 text-[#1FB6D5] mr-2 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#021019]/50 p-6 rounded-xl border border-slate-800">
                      <h4 className="text-white font-bold text-lg mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 text-[#1FA77A] mr-2" /> Resultados
                      </h4>
                      <ul className="space-y-4">
                        <li className="flex items-start text-slate-300">
                          <span className="w-1.5 h-1.5 bg-[#1FA77A] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Operación ordenada y sostenible bajo alta demanda.
                        </li>
                        <li className="flex items-start text-slate-300">
                          <span className="w-1.5 h-1.5 bg-[#1FA77A] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Equipo capacitado y rotación reducida.
                        </li>
                        <li className="flex items-start text-slate-300">
                          <span className="w-1.5 h-1.5 bg-[#1FA77A] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Carta rentable y sistema de control funcionando.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Caso 2: COLIFA */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl hover:border-[#1FB6D5]/30 transition-all">
                <div className="p-8 md:p-10">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-6">
                    <div>
                      <h3 className="text-3xl font-bold text-white font-space mb-2">COLIFA</h3>
                      <span className="inline-block bg-[#00344F] text-[#1FB6D5] text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">
                        Concepto, Carta & Procesos
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <h4 className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-3">Acciones Clave</h4>
                      <ul className="space-y-2 mb-6">
                        {[
                          "Diseño integral de carta (identidad y rentabilidad).",
                          "Creación de fichas técnicas completas.",
                          "Capacitación de salón: secuencia de servicio.",
                          "Diseño de carta digital y física.",
                          "Videos de capacitación para procesos."
                        ].map((item, i) => (
                          <li key={i} className="flex items-start text-sm text-slate-300">
                            <CheckCircle className="w-4 h-4 text-[#1FB6D5] mr-2 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#021019]/50 p-6 rounded-xl border border-slate-800">
                      <h4 className="text-white font-bold text-lg mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 text-[#1FA77A] mr-2" /> Resultados
                      </h4>
                      <ul className="space-y-4">
                        <li className="flex items-start text-slate-300">
                          <span className="w-1.5 h-1.5 bg-[#1FA77A] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Carta consistente alineada al concepto.
                        </li>
                        <li className="flex items-start text-slate-300">
                          <span className="w-1.5 h-1.5 bg-[#1FA77A] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Equipo de salón con secuencia profesional.
                        </li>
                        <li className="flex items-start text-slate-300">
                          <span className="w-1.5 h-1.5 bg-[#1FA77A] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Activos digitales listos para escalar.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Caso 3: Cerdo Va! */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl hover:border-[#1FB6D5]/30 transition-all">
                <div className="p-8 md:p-10">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-6">
                    <div>
                      <h3 className="text-3xl font-bold text-white font-space mb-2">Cerdo Va!</h3>
                      <span className="inline-block bg-[#00344F] text-[#1FB6D5] text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">
                        Producto & Sistema de Costos
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <h4 className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-3">Acciones Clave</h4>
                      <ul className="space-y-2 mb-6">
                        {[
                          "Diseño de productos centrados en cerdo.",
                          "Fichas técnicas (recetas, costos, controles).",
                          "Capacitación en inocuidad y BPM.",
                          "Desarrollo de 'Cerdo Va! Ops' (mini web de gestión)."
                        ].map((item, i) => (
                          <li key={i} className="flex items-start text-sm text-slate-300">
                            <CheckCircle className="w-4 h-4 text-[#1FB6D5] mr-2 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#021019]/50 p-6 rounded-xl border border-slate-800">
                      <h4 className="text-white font-bold text-lg mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 text-[#1FA77A] mr-2" /> Resultados
                      </h4>
                      <ul className="space-y-4">
                        <li className="flex items-start text-slate-300">
                          <span className="w-1.5 h-1.5 bg-[#1FA77A] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Productos consistentes y controlados.
                        </li>
                        <li className="flex items-start text-slate-300">
                          <span className="w-1.5 h-1.5 bg-[#1FA77A] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Margen saludable por control estricto de costos.
                        </li>
                        <li className="flex items-start text-slate-300">
                          <span className="w-1.5 h-1.5 bg-[#1FA77A] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Herramienta digital propia para gestión.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SECCIÓN 2: SERVICIOS */}
          <div className="mb-24">
            <h2 className="text-2xl font-bold text-white mb-8 border-l-4 border-[#1FB6D5] pl-4 font-space flex items-center">
              <Layers className="w-6 h-6 text-[#1FB6D5] mr-3" />
              Servicios Octopus
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <BarChart2 className="w-8 h-8 text-[#1FB6D5]" />,
                  title: "Control y Números",
                  problem: "“No sé si gano o pierdo.”",
                  items: ["Estado de Resultado.", "Control CMV y Mano de obra.", "Tableros y reportes."]
                },
                {
                  icon: <Settings className="w-8 h-8 text-[#1FB6D5]" />,
                  title: "Orden y Procesos",
                  problem: "“Alto estrés y errores.”",
                  items: ["Diseño de procesos.", "Checklists operativos.", "Capacitación en Orden."]
                },
                {
                  icon: <Star className="w-8 h-8 text-[#1FB6D5]" />,
                  title: "Diseño de Carta",
                  problem: "“Carta poco rentable.”",
                  items: ["Ingeniería de menú.", "Fichas técnicas.", "Análisis de rentabilidad."]
                },
                {
                  icon: <Zap className="w-8 h-8 text-[#1FB6D5]" />,
                  title: "Tecnología",
                  problem: "“Datos dispersos.”",
                  items: ["Planillas inteligentes.", "Integración sistemas.", "Asistentes IA."]
                },
                {
                  icon: <Users className="w-8 h-8 text-[#1FB6D5]" />,
                  title: "Capacitación",
                  problem: "“Equipo sin técnica.”",
                  items: ["Entrenamiento cocina.", "Secuencia de servicio.", "Auditorías."]
                },
                {
                  icon: <TrendingUp className="w-8 h-8 text-[#1FB6D5]" />,
                  title: "Acompañamiento",
                  problem: "“Aperturas o crisis.”",
                  items: ["Modelo operativo.", "Puesta en marcha.", "Soporte presencial."]
                }
              ].map((service, idx) => (
                <div key={idx} className="bg-slate-900 p-8 rounded-xl border border-slate-800 hover:border-[#1FB6D5] transition-colors group">
                  <div className="mb-6 bg-[#00344F]/50 w-16 h-16 rounded-full flex items-center justify-center border border-slate-700 group-hover:border-[#1FB6D5]">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 font-space">{service.title}</h3>
                  <p className="text-[#D64747] text-sm font-medium italic mb-4">{service.problem}</p>
                  <ul className="space-y-2">
                    {service.items.map((it, i) => (
                      <li key={i} className="text-slate-400 text-sm flex items-start">
                        <span className="w-1 h-1 bg-slate-500 rounded-full mt-2 mr-2"></span>
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
                <Button size="lg" className="bg-[#1FB6D5] text-[#021019] hover:bg-white font-bold">
                  Consultar por un servicio
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
            </div>
          </div>

          {/* SECCIÓN 3: ACTIVOS DIGITALES */}
          <div className="bg-[#00344F]/30 p-8 rounded-2xl border border-slate-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-white font-space mb-2">Activos Digitales Disponibles</h3>
                <p className="text-slate-400 text-sm">Ejemplos reales de herramientas que implementamos.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {/* Colifa Menu Linked Button */}
                <a href={COLIFA_MENU_URL || '#'} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="text-xs hover:border-[#1FB6D5] hover:text-[#1FB6D5]">
                    <ExternalLink className="w-3 h-3 mr-2" /> Carta Digital COLIFA
                  </Button>
                </a>

                {/* Technical Sheets Example Linked Button */}
                <a href={TECHNICAL_SHEETS_EXAMPLE_URL || '#'} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="text-xs hover:border-[#1FB6D5] hover:text-[#1FB6D5]">
                    <FileText className="w-3 h-3 mr-2" /> Ejemplo Ficha Técnica
                  </Button>
                </a>

                {/* Process Example Linked Button */}
                <a href={PROCESS_EXAMPLE_URL || '#'} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="text-xs hover:border-[#1FB6D5] hover:text-[#1FB6D5]">
                    <Layers className="w-3 h-3 mr-2" /> Ejemplo Procesos
                  </Button>
                </a>

                <Button variant="outline" className="text-xs hover:border-[#1FB6D5] hover:text-[#1FB6D5]">
                  <ExternalLink className="w-3 h-3 mr-2" /> Cerdo Va! Ops
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Services;