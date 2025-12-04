import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { ACADEMY_RESOURCES, WHATSAPP_NUMBER } from '../constants';
import { Play, Download, MessageCircle, ArrowLeft, Check, BookOpen } from 'lucide-react';
import Button from '../components/ui/Button';

const ResourceDetail = () => {
  const { id } = useParams();
  const resource = ACADEMY_RESOURCES.find(r => r.id === id);

  if (!resource) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center text-slate-400">
          Recurso no encontrado. <Link to="/resources" className="text-cyan-400 ml-2">Volver a la Academia</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-slate-950 min-h-screen pb-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          <Link to="/resources" className="inline-flex items-center text-slate-400 hover:text-white mb-6 text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver a la Academia
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex gap-2 mb-4">
               <span className="bg-cyan-900/30 text-cyan-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                 {resource.type}
               </span>
               <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded text-xs font-medium">
                 {resource.duration}
               </span>
               {resource.topics.map(t => (
                 <span key={t} className="bg-slate-800 text-slate-400 px-3 py-1 rounded text-xs font-medium capitalize">
                   {t}
                 </span>
               ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{resource.title}</h1>
            <p className="text-xl text-slate-400">{resource.summary}</p>
          </div>

          {/* Main Content Area */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden mb-10">
            {resource.type === 'video' ? (
              <div className="aspect-video bg-black flex items-center justify-center relative group cursor-pointer">
                 {/* Placeholder for YouTube Embed */}
                 <div className="absolute inset-0 bg-slate-800 opacity-50"></div>
                 <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white z-10 shadow-xl group-hover:scale-110 transition-transform">
                   <Play className="w-8 h-8 ml-1" fill="currentColor" />
                 </div>
                 <p className="absolute bottom-4 text-slate-400 text-sm z-10">Simulación de Embed YouTube</p>
              </div>
            ) : (
              <div className="p-12 bg-slate-800 flex flex-col items-center justify-center text-center">
                 <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-10 h-10 text-slate-400" />
                 </div>
                 <h3 className="text-white font-bold text-xl mb-2">Recurso de Lectura / Descarga</h3>
                 <p className="text-slate-400 max-w-md">Este contenido está diseñado para ser leído o utilizado como herramienta de trabajo.</p>
                 {resource.downloadUrl && (
                    <Button className="mt-6">
                      <Download className="w-4 h-4 mr-2" /> Descargar Material
                    </Button>
                 )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              
              {/* En Cristiano Block */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-2">En cristiano</h3>
                <p className="text-slate-300 leading-relaxed">
                  {resource.description}
                </p>
              </div>

              {/* Action Steps */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl border border-slate-700">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                   <span className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-cyan-900/50">
                     <Check className="w-5 h-5" strokeWidth={3} />
                   </span>
                   Aplicá esto ahora mismo
                 </h3>
                 <ul className="space-y-4">
                   {resource.actionSteps.map((step, idx) => (
                     <li key={idx} className="flex items-start text-slate-300">
                       <span className="text-cyan-500 font-bold mr-3 mt-0.5">{idx + 1}.</span>
                       {step}
                     </li>
                   ))}
                 </ul>
              </div>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
               <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Ideal para</h4>
                  <ul className="space-y-2">
                    {resource.idealFor.map((persona, idx) => (
                      <li key={idx} className="text-sm text-slate-400 flex items-start">
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5 mr-2"></span>
                        {persona}
                      </li>
                    ))}
                  </ul>
               </div>

               <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                 <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Metodología 7P</h4>
                 <div className="flex gap-2">
                    {resource.letters7p.map(l => (
                      <div key={l} className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center font-bold text-cyan-500 border border-slate-700">
                        {l.charAt(0)}
                      </div>
                    ))}
                 </div>
                 <p className="text-xs text-slate-500 mt-3">
                   Este contenido refuerza los ejes clave de tu modelo de negocio.
                 </p>
               </div>

               <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="block">
                 <Button fullWidth variant="secondary" className="justify-center">
                   <MessageCircle className="w-4 h-4 mr-2" /> Ayuda para implementar
                 </Button>
               </a>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default ResourceDetail;