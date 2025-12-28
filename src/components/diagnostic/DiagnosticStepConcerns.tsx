import React from 'react';
import { QuickDiagnosticData } from '../../types';
import Button from '../ui/Button';
import { Check } from 'lucide-react';

interface DiagnosticStepConcernsProps {
    formData: QuickDiagnosticData;
    handleConcernChange: (value: string) => void;
    prevStep: () => void;
    nextStep: () => void;
}

const CONCERNS = [
    "Costos demasiado altos",
    "Poco margen de ganancia",
    "Caos operativo / nadie sigue procesos",
    "Equipo desmotivado / alta rotación",
    "Quejas de clientes / Reseñas malas",
    "Quiebres de stock",
    "No tengo idea de mis números"
];

const DiagnosticStepConcerns: React.FC<DiagnosticStepConcernsProps> = ({ formData, handleConcernChange, prevStep, nextStep }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2 font-space">¿Qué te quita el sueño?</h2>
                <p className="text-slate-400">Seleccioná todo lo que aplique a tu situación actual.</p>
            </div>

            <div className="space-y-3">
                {CONCERNS.map(option => (
                    <label key={option} className={`flex items-start md:items-center p-4 rounded-xl border cursor-pointer transition-all group ${formData.primaryConcern.includes(option) ? 'border-[#1FB6D5] bg-[#1FB6D5]/10' : 'border-slate-700 hover:bg-slate-800'}`}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-4 mt-1 md:mt-0 transition-colors flex-shrink-0 ${formData.primaryConcern.includes(option) ? 'border-[#1FB6D5] bg-[#1FB6D5] text-[#021019]' : 'border-slate-500'}`}>
                            {formData.primaryConcern.includes(option) && <Check className="w-3 h-3" strokeWidth={4} />}
                        </div>
                        <span className={`text-lg ${formData.primaryConcern.includes(option) ? 'text-[#1FB6D5] font-bold' : 'text-slate-300 group-hover:text-white'}`}>{option}</span>
                        <input
                            type="checkbox"
                            name="primaryConcern"
                            value={option}
                            checked={formData.primaryConcern.includes(option)}
                            onChange={() => handleConcernChange(option)}
                            className="hidden"
                        />
                    </label>
                ))}
            </div>
            <div className="flex gap-4 pt-4">
                <Button variant="secondary" onClick={prevStep}>Atrás</Button>
                <Button onClick={nextStep} fullWidth disabled={formData.primaryConcern.length === 0}>Siguiente</Button>
            </div>
        </div>
    );
};

export default DiagnosticStepConcerns;
