import React from 'react';
import { QuickDiagnosticData } from '../../types';
import Button from '../ui/Button';

interface DiagnosticStep7PProps {
    formData: QuickDiagnosticData;
    handleScoreChange: (key: string, score: number) => void;
    prevStep: () => void;
    nextStep: () => void;
}

const QUESTIONS_7P = [
    { key: 'O', letter: 'Orden', text: 'En tu día a día, ¿qué tan claros y escritos están los procedimientos (apertura, cierre, caja)?', low: 'Nada claros', high: 'Muy claros' },
    { key: 'T', letter: 'Tecnología', text: '¿Registrás tus ventas y gastos en algún sistema o planilla que uses de verdad?', low: 'Casi nada', high: 'Siempre' },
    { key: 'O_obs', letter: 'Observación', text: '¿Con qué frecuencia mirás tus números?', low: 'Casi nunca', high: 'Semanalmente' },
    { key: 'P', letter: 'Pragmatismo', text: '¿Tenés metas numéricas claras (ej: bajar costo de mercadería al 35%)?', low: 'No', high: 'Sí, claras' },
    { key: 'C', letter: 'Creatividad', text: '¿Cada cuánto revisás o renovás tu propuesta (carta, combos, experiencias)?', low: 'Nunca', high: 'Frecuentemente' },
    { key: 'U', letter: 'Universalidad', text: '¿Tu negocio es replicable (podrías abrir otro igual con el mismo modelo)?', low: 'Imposible', high: 'Sí, bastante' },
    { key: 'S', letter: 'Sutileza', text: '¿Cómo manejás reseñas, quejas y pequeños detalles de servicio?', low: 'Ignoramos', high: 'Actuamos rápido' },
];

const DiagnosticStep7P: React.FC<DiagnosticStep7PProps> = ({ formData, handleScoreChange, prevStep, nextStep }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2 font-space">Check Rápido 7P</h2>
                <p className="text-slate-400">Sé honesto. Nadie te juzga (solo el algoritmo).</p>
            </div>

            <div className="space-y-8">
                {QUESTIONS_7P.map((item) => {
                    const currentScore = formData.methodologyScores[item.key] || 0;
                    return (
                        <div key={item.key} className="border-b border-slate-800 pb-6 last:border-0">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-[#00344F] text-[#1FB6D5] text-xs font-bold px-2 py-1 rounded font-mono border border-[#1FB6D5]/20">{item.letter}</span>
                                <span className="text-slate-200 font-medium">{item.text}</span>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-slate-500 uppercase font-bold w-20">{item.low}</span>
                                <div className="flex gap-2 sm:gap-4">
                                    {[1, 2, 3, 4, 5].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => handleScoreChange(item.key, val)}
                                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-bold text-lg transition-all ${currentScore === val
                                                ? 'bg-[#1FB6D5] text-[#021019] scale-110 shadow-lg shadow-[#1FB6D5]/30'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                                }`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs text-slate-500 uppercase font-bold w-20 text-right">{item.high}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-4 pt-4">
                <Button variant="secondary" onClick={prevStep}>Atrás</Button>
                <Button onClick={nextStep} fullWidth>Siguiente</Button>
            </div>
        </div>
    );
};

export default DiagnosticStep7P;
