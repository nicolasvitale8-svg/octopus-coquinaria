
import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { METHODOLOGY_7P } from '../constants';
import { ArrowRight, CheckCircle, AlertTriangle, Zap, X, Video, FileText, BarChart2 } from 'lucide-react';
import Button from '../components/ui/Button';

// Level 3: Dynamic Pill Component
const DynamicPill = ({ pills }: { pills: string[] }) => {
  // Select one random pill on mount/change
  const randomPill = useMemo(() => {
    return pills[Math.floor(Math.random() * pills.length)];
  }, [pills]);

  return (
    <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-900/50 rounded-lg p-4 mt-6">
      <div className="flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <p className="text-cyan-200 italic font-medium text-sm md:text-base">"{randomPill}"</p>
      </div>
    </div>
  );
};

const Methodology = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedMethodology = useMemo(() => 
    METHODOLOGY_7P.find(m => m.id === selectedId), 
  [selectedId]);

  return (
    <Layout>
      <div className="bg-slate-950 py-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header - Level 1 */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Metodología <span className="text-cyan-400">Octopus 7P</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              El pulpo no es un logo. Es una forma de decidir.
            </p>
          </div>

          {/* Grid - Level 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {METHODOLOGY_7P.map((item) => (
              <div 
                key={item.id} 
                className="bg-slate-900 rounded-2xl border border-slate-800 p-8 flex flex-col items-start hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-900/10 transition-all cursor-pointer group h-full"
                onClick={() => setSelectedId(item.id)}
              >
                <div className="flex items-center gap-4 mb-4 w-full">
                  <div className="w-14 h-14 bg-slate-800 group-hover:bg-cyan-900 rounded-xl flex items-center justify-center text-2xl font-bold text-cyan-400 transition-colors shadow-inner">
                    {item.key}
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">{item.letter}</h3>
                </div>
                
                <p className="text-lg text-slate-300 mb-2 font-medium italic">"{item.tagline}"</p>
                
                {/* Micro-example from symptoms for context */}
                <p className="text-sm text-slate-500 mb-6 flex-grow">
                  Ataca problemas como: {item.symptoms[0].toLowerCase()}
                </p>
                
                <button className="text-cyan-400 font-bold hover:text-cyan-300 flex items-center text-sm uppercase tracking-wide mt-auto">
                  Ver detalle <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"/>
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
             <p className="text-slate-500 text-sm">Hacé click en cada tarjeta para profundizar en el concepto.</p>
          </div>
        </div>

        {/* Modal - Level 2 & 3 */}
        {selectedMethodology && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm transition-opacity" 
              onClick={() => setSelectedId(null)}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedId(null)}
                className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-8 md:p-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6 items-start border-b border-slate-800 pb-8 mb-8">
                   <div className="w-20 h-20 bg-gradient-to-br from-cyan-600 to-blue-900 rounded-2xl flex items-center justify-center text-5xl font-bold text-white shadow-lg shrink-0">
                      {selectedMethodology.key}
                   </div>
                   <div>
                     <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{selectedMethodology.letter}</h2>
                     <p className="text-xl text-cyan-400 italic">"{selectedMethodology.tagline}"</p>
                   </div>
                </div>

                <div className="space-y-8">
                  
                  {/* Definition */}
                  <div>
                    <p className="text-lg text-slate-300 leading-relaxed">
                      {selectedMethodology.description}
                    </p>
                  </div>

                  {/* Two Columns Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Importance */}
                    <div>
                      <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        Por qué es clave
                      </h3>
                      <ul className="space-y-3">
                        {selectedMethodology.importance.map((imp, idx) => (
                          <li key={idx} className="text-sm text-slate-400 flex items-start">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                            {imp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Symptoms */}
                    <div className="bg-red-900/10 border border-red-900/20 rounded-xl p-5">
                      <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                        Síntomas de falla
                      </h3>
                      <ul className="space-y-3">
                        {selectedMethodology.symptoms.map((sym, idx) => (
                          <li key={idx} className="text-sm text-slate-300 flex items-start">
                             <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                             {sym}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                      <Zap className="w-5 h-5 text-cyan-400 mr-2" fill="currentColor" />
                      Cómo lo trabajamos en Octopus
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedMethodology.actions.map((action, idx) => (
                        <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-start">
                           <span className="text-cyan-500 font-bold mr-3">{idx + 1}.</span>
                           <span className="text-sm text-slate-300">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Level 3: Dynamic Pill */}
                  <DynamicPill pills={selectedMethodology.pills} />

                  {/* Footer Links */}
                  <div className="border-t border-slate-800 pt-8 mt-8 flex flex-wrap gap-4 justify-between items-center">
                     <div className="flex gap-4">
                       <button className="flex items-center text-sm text-slate-400 hover:text-white transition-colors">
                         <Video className="w-4 h-4 mr-2" /> Videos relacionados
                       </button>
                       <button className="flex items-center text-sm text-slate-400 hover:text-white transition-colors">
                         <FileText className="w-4 h-4 mr-2" /> Notas y tips
                       </button>
                     </div>
                     <a href="/quick-diagnostic">
                       <Button size="sm" className="bg-slate-800 hover:bg-slate-700 border border-slate-600">
                         <BarChart2 className="w-4 h-4 mr-2" />
                         Ver impacto en diagnóstico
                       </Button>
                     </a>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Methodology;
