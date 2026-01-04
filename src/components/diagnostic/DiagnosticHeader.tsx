import React from 'react';
import { Sparkles } from 'lucide-react';

interface DiagnosticHeaderProps {
    step: number;
    steps: string[];
    showTitle?: boolean;
}

const DiagnosticHeader: React.FC<DiagnosticHeaderProps> = ({ step, steps, showTitle = true }) => {
    return (
        <>
            {showTitle && (
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white font-space">Diagnóstico Express</h1>
                </div>
            )}

            {/* Progress Bar */}
            <div className="mb-10">
                <div className="flex justify-between mb-2 px-1">
                    {steps.map((s, i) => (
                        <span key={s} className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${i <= step ? 'text-[#1FB6D5]' : 'text-slate-600'}`}>
                            {s}
                        </span>
                    ))}
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-2 bg-[#1FB6D5] rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_#1FB6D5]"
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    ></div>
                </div>
            </div>
        </>
    );
};

export default DiagnosticHeader;
