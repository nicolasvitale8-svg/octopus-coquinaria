import React from 'react';

interface Props {
    spent: number;
    budgeted: number;
}

export const BudgetRPMGauge: React.FC<Props> = ({ spent, budgeted }) => {
    const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
    const clampedPercentage = Math.min(percentage, 120);

    // SVG Arc calculation for semi-circle
    const radius = 70;
    const strokeWidth = 10;
    const circumference = Math.PI * radius; // Semi-circle
    const progress = (clampedPercentage / 100) * circumference;

    const getStatusColor = () => {
        if (percentage < 75) return '#10B981'; // Green
        if (percentage < 100) return '#F59E0B'; // Amber
        return '#EF4444'; // Red
    };

    const getStatusText = () => {
        if (percentage < 75) return 'En Control';
        if (percentage < 100) return 'Precaución';
        return 'Excedido';
    };

    const formatBudget = (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
        return `$${value.toFixed(0)}`;
    };

    return (
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 h-full flex flex-col items-center justify-center">
            {/* Header */}
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                Salud del Presupuesto
            </h3>

            {/* Gauge Container */}
            <div className="relative w-52 h-32">
                <svg viewBox="0 0 200 110" className="w-full h-full">
                    {/* Background Arc */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="#1E293B"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />

                    {/* Progress Arc */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke={getStatusColor()}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={`${progress} ${circumference}`}
                        className="transition-all duration-700 ease-out"
                        style={{ filter: `drop-shadow(0 0 6px ${getStatusColor()}80)` }}
                    />

                    {/* Min/Max Labels */}
                    <text x="20" y="115" textAnchor="middle" className="text-[10px] font-bold" fill="#64748B">0%</text>
                    <text x="180" y="115" textAnchor="middle" className="text-[10px] font-bold" fill="#64748B">100%</text>

                    {/* Center Percentage */}
                    <text x="100" y="75" textAnchor="middle" className="text-4xl font-black" fill="white">
                        {percentage.toFixed(0)}%
                    </text>
                    <text x="100" y="95" textAnchor="middle" className="text-[11px] font-bold" fill="#94A3B8">
                        consumido
                    </text>
                </svg>
            </div>

            {/* Status Badge */}
            <div
                className="mt-4 px-4 py-2 rounded-full border-2 flex items-center gap-2 transition-all"
                style={{
                    backgroundColor: `${getStatusColor()}15`,
                    borderColor: `${getStatusColor()}50`,
                    color: getStatusColor()
                }}
            >
                <div
                    className={`w-2 h-2 rounded-full ${percentage >= 100 ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: getStatusColor() }}
                ></div>
                <span className="text-xs font-black uppercase tracking-wider">{getStatusText()}</span>
            </div>

            {/* Budget Info */}
            <div className="mt-6 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Presupuesto</p>
                <p className="text-xl font-black text-white tabular-nums">{formatBudget(budgeted)}</p>
            </div>
        </div>
    );
};
