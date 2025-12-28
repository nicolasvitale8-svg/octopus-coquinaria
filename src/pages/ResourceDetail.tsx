import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ACADEMY_RESOURCES, WHATSAPP_NUMBER } from '../constants';
import { Play, Download, MessageCircle, ArrowLeft, Check, BookOpen } from 'lucide-react';
import Button from '../components/ui/Button';
import { AcademyResource } from '../types';

const ResourceDetail = () => {
  const { id } = useParams();
  const { isPremium, isConsultant, isAdmin } = useAuth();
  const [resource, setResource] = useState<AcademyResource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResource = async () => {
      if (!id || !supabase) return;

      const { data, error } = await supabase
        .from('recursos_academia')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        // Map DB response to AcademyResource type
        setResource({
          id: data.id,
          title: data.titulo,
          type: data.tipo === 'plantilla' ? 'template' : data.tipo === 'guia' ? 'guide' : 'video',
          duration: '12 min', // Default placeholder as DB might miss it
          topics: ['finanzas', 'operaciones'], // Default placeholder
          letters7p: ['O'], // Default
          summary: data.descripcion,
          description: data.descripcion, // Using description for both currently
          idealFor: ['Dueños', 'Gerentes'],
          actionSteps: ['Ver el video completo.', 'Tomar nota de los puntos clave.', 'Aplicar en el negocio.'],
          downloadUrl: data.url,
          youtubeId: data.url?.includes('youtu') ? (data.url.split('v=')[1] || data.url.split('/').pop()) : undefined, // Extract ID from URL if possible
          es_premium: data.es_premium
        });
      } else {
        // Fallback to constants if not found in DB (for backward compatibility during migration)
        const staticRes = ACADEMY_RESOURCES.find(r => r.id === id);
        if (staticRes) setResource(staticRes);
      }
      setLoading(false);
    };

    fetchResource();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center text-slate-400">
          Cargando recurso...
        </div>
      </Layout>
    )
  }

  if (!resource) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center text-slate-400">
          Recurso no encontrado. <Link to="/resources" className="text-cyan-400 ml-2">Volver a la Academia</Link>
        </div>
      </Layout>
    );
  }

  const hasAccess = !resource.es_premium || isPremium || isConsultant || isAdmin;

  // Render Video Embed
  const renderVideo = () => {
    const videoId = resource.youtubeId || (resource.downloadUrl?.includes('youtu') ? (resource.downloadUrl.split('v=')[1]?.split('&')[0] || resource.downloadUrl.split('/').pop()) : null);

    if (!videoId) return (
      <div className="aspect-video bg-black flex items-center justify-center text-slate-500">
        Video no disponible o URL inválida.
      </div>
    );

    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={resource.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  };

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
              {resource.es_premium && (
                <span className="bg-amber-900/30 text-amber-500 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border border-amber-500/30">
                  Premium
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{resource.title}</h1>
            <p className="text-xl text-slate-400">{resource.summary}</p>
          </div>

          {!hasAccess ? (
            <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
                <Play className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Contenido Exclusivo Premium</h3>
              <p className="text-slate-400 max-w-lg mx-auto mb-8">
                Este recurso está reservado para miembros de la comunidad Octopus con acceso Premium.
                Contacta a soporte o actualiza tu plan para acceder.
              </p>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Quiero%20acceder%20al%20contenido%20Premium%20${resource.title}`} target="_blank" rel="noreferrer">
                <Button>Solicitar Acceso</Button>
              </a>
            </div>
          ) : (
            <>
              {/* Main Content Area */}
              <div className="mb-10">
                {resource.type === 'video' || resource.type === 'video' as any ? ( // Loose type match check
                  renderVideo()
                ) : (
                  <div className="p-12 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mb-6">
                      <BookOpen className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Recurso de Lectura / Descarga</h3>
                    <p className="text-slate-400 max-w-md">Este contenido está diseñado para ser leído o utilizado como herramienta de trabajo.</p>
                    {resource.downloadUrl && (
                      <a href={resource.downloadUrl} target="_blank" rel="noopener noreferrer">
                        <Button className="mt-6">
                          <Download className="w-4 h-4 mr-2" /> Descargar Material
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">

                  {/* En Cristiano Block */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-2">Descripción</h3>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {resource.description}
                    </p>
                  </div>

                  {/* Action Steps */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-cyan-900/50">
                        <Check className="w-5 h-5" strokeWidth={3} />
                      </span>
                      Pasos recomendados
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

                  <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="block">
                    <Button fullWidth variant="secondary" className="justify-center">
                      <MessageCircle className="w-4 h-4 mr-2" /> Ayuda para implementar
                    </Button>
                  </a>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default ResourceDetail;