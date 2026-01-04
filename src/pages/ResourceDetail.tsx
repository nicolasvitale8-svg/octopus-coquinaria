import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ACADEMY_RESOURCES, WHATSAPP_NUMBER } from '../constants';
import { Play, Download, MessageCircle, ArrowLeft, Check, BookOpen, Clock, Tag } from 'lucide-react';
import Button from '../components/ui/Button';
import { AcademyResource } from '../types';

const ResourceDetail = () => {
  const { id } = useParams();
  const { profile, isConsultant, isAdmin } = useAuth();
  const [resource, setResource] = useState<AcademyResource | null>(null);
  const [loading, setLoading] = useState(true);

  const plan = profile?.plan || 'FREE';

  useEffect(() => {
    const fetchResource = async () => {
      if (!id || !supabase) return;

      const { data, error } = await supabase
        .from('recursos_academia')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setResource({
          id: data.id,
          title: data.titulo || data.title,
          description: data.description || data.descripcion,
          outcome: data.outcome || '',
          category: data.category || 'OPERACIONES',
          format: data.format || 'VIDEO',
          impactTag: data.impact_tag || 'HERRAMIENTA',
          level: data.level || 1,
          durationMinutes: data.duration_minutes || 0,
          access: data.access || 'PUBLIC',
          isPinned: data.is_pinned || false,
          createdAt: data.created_at,
          downloadUrl: data.url,
          youtubeId: data.youtube_id || (data.url?.includes('youtu') ? (data.url.split('v=')[1]?.split('&')[0] || data.url.split('/').pop()) : undefined),
          actionSteps: data.action_steps || [],
          pilares: data.pilares || []
        });
      } else {
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
          Recurso no encontrado. <Link to="/resources" className="text-[#1FB6D5] ml-2">Volver a la Academia</Link>
        </div>
      </Layout>
    );
  }

  const hasAccess = resource.access === 'PUBLIC' || plan === 'PRO' || isConsultant || isAdmin;

  const renderVideo = () => {
    const videoId = resource.youtubeId;

    if (!videoId) return (
      <div className="aspect-video bg-black flex items-center justify-center text-slate-500 rounded-xl">
        Video no disponible.
      </div>
    );

    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800">
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
      <div className="bg-[#021019] min-h-screen pb-20">
        <div className="max-w-4xl mx-auto px-4 py-8">

          <Link to="/resources" className="inline-flex items-center text-slate-400 hover:text-white mb-6 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver a la Academia
          </Link>

          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-slate-900 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-800">
                {resource.format}
              </span>
              <span className="bg-[#1FB6D5]/10 text-[#1FB6D5] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[#1FB6D5]/20">
                {resource.category}
              </span>
              {resource.access === 'PRO' && (
                <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
                  Premium
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">{resource.title}</h1>
            {resource.outcome && (
              <p className="text-lg md:text-xl text-[#1FB6D5] font-medium italic opacity-90">{resource.outcome}</p>
            )}
          </div>

          {!hasAccess ? (
            <div className="bg-slate-900/50 backdrop-blur-md border border-amber-500/30 rounded-3xl p-12 text-center shadow-2xl">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500 border border-amber-500/20">
                <Play className="w-10 h-10 ml-1" fill="currentColor" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Contenido Exclusivo PRO</h3>
              <p className="text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
                Este recurso está reservado para miembros de la comunidad Octopus con acceso PRO.
                Desbloquea rutas de aprendizaje, herramientas avanzadas y consultoría.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Quiero%20acceder%20al%20plan%20PRO%20de%20Octopus`} target="_blank" rel="noreferrer">
                  <Button className="bg-amber-500 text-black hover:bg-white w-full sm:w-auto">Actualizar a PRO</Button>
                </a>
                <Link to="/resources">
                  <Button variant="ghost" className="text-slate-400 w-full sm:w-auto">Ver recursos gratuitos</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Media Section */}
              <div className="mb-12">
                {resource.format === 'VIDEO' ? (
                  renderVideo()
                ) : (
                  <div className="p-16 bg-slate-900/30 rounded-3xl border border-slate-800 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                    <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 rotate-3 transform transition-transform hover:rotate-0">
                      <BookOpen className="w-10 h-10 text-[#1FB6D5]" />
                    </div>
                    <h3 className="text-white font-bold text-2xl mb-3 tracking-tight">Material de Trabajo</h3>
                    <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
                      Este es un recurso descargable diseñado para ser implementado directamente en tu negocio.
                    </p>
                    {resource.downloadUrl && (
                      <a href={resource.downloadUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                        <Button className="w-full">
                          <Download className="w-4 h-4 mr-2" /> Descargar Material
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">

                  {/* Info Blocks */}
                  <div className="flex flex-wrap gap-6 border-b border-slate-800 pb-8">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-slate-500" />
                      <span className="text-slate-400 text-sm font-medium">{resource.durationMinutes} minutos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-slate-500" />
                      <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">{resource.impactTag}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-6 tracking-tight">Sobre este recurso</h3>
                    <p className="text-slate-400 leading-relaxed text-lg whitespace-pre-wrap">
                      {resource.description}
                    </p>
                  </div>

                  {/* Action Steps */}
                  {resource.actionSteps && resource.actionSteps.length > 0 && (
                    <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-8 shadow-xl">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center tracking-tight">
                        <span className="w-10 h-10 bg-[#1FB6D5] rounded-xl flex items-center justify-center text-black mr-4 shadow-lg shadow-[#1FB6D5]/20">
                          <Check className="w-6 h-6" strokeWidth={3} />
                        </span>
                        Pasos de Acción
                      </h3>
                      <div className="space-y-4">
                        {resource.actionSteps.map((step, idx) => (
                          <div key={idx} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-800/30 transition-colors group">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-[#1FB6D5] group-hover:bg-[#1FB6D5] group-hover:text-black transition-colors">
                              {idx + 1}
                            </span>
                            <p className="text-slate-300 font-medium">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Methodology Link */}
                  {resource.pilares && resource.pilares.length > 0 && (
                    <div className="bg-[#1FB6D5]/5 p-6 rounded-3xl border border-[#1FB6D5]/10">
                      <h4 className="font-bold text-[#1FB6D5] mb-4 text-xs uppercase tracking-widest">Pilar Octopus</h4>
                      <div className="flex flex-wrap gap-2">
                        {resource.pilares.map(p => (
                          <span key={p} className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase border border-slate-800">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Necesito%20ayuda%20para%20aplicar%20${resource.title}`} target="_blank" rel="noreferrer" className="block">
                    <Button fullWidth variant="secondary" className="justify-center h-14 rounded-2xl">
                      <MessageCircle className="w-5 h-5 mr-2" /> Consultar experto
                    </Button>
                  </a>

                  <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800">
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                      "El conocimiento solo es poder si se aplica. Empieza por el paso 1 hoy mismo."
                    </p>
                  </div>
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