
import React from 'react';

interface Props {
    spent: number;
    budgeted: number;
}

export const BudgetRPMGauge: React.FC<Props> = ({ spent, budgeted }) => {
    const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
    const clampedPercentage = Math.min(percentage, 120);

    // Needle angle for the semi-circle (180 degrees total)
    // 0% => -180deg (left), 100% => 0deg (right)
    const angle = (clampedPercentage / 100) * 180 - 180;

    const getStatusColor = () => {
        if (percentage < 70) return '#10B981'; // Emerald
        if (percentage < 95) return '#F59E0B'; // Amber
        return '#EF4444'; // Red
    };

    return (
        <div className="relative flex flex-col items-center justify-center p-10 bg-[#0b1221]/60 backdrop-blur-xl rounded-[40px] border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.3)] h-full group overflow-hidden">
            {/* Dynamic Background Glow */}
            <div className={`absolute inset-0 opacity-20 transition-all duration-1000 blur-[80px] pointer-events-none ${percentage > 100 ? 'bg-red-500/30' : 'bg-brand/20'}`}></div>

            <div className="relative w-full aspect-[4/3] flex items-center justify-center">
                <svg viewBox="0 0 200 140" className="w-full h-full drop-shadow-2xl">
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
                            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.5" />
                        </linearGradient>
                        <filter id="neonGlow">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Background Track */}
                    <path
                        d="M 20 120 A 80 80 0 0 1 180 120"
                        fill="none"
                        stroke="#1F2937"
                        strokeWidth="14"
                        strokeLinecap="round"
                    />

                    {/* Active Track with Gradient Masking (Simplified) */}
                    <path
                        d="M 20 120 A 80 80 0 0 1 180 120"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray={`${(clampedPercentage / 100) * 251.3} 251.3`} // 251.3 is approx semicircle length
                        className="transition-all duration-1000 ease-out"
                        filter="url(#neonGlow)"
                    />

                    {/* RPM Indicators */}
                    {[0, 2, 4, 6, 8, 10].map((val, i) => {
                        const tickAngle = (i / 5) * 180 - 180;
                        const r = 95;
                        const x = 100 + r * Math.cos((tickAngle * Math.PI) / 180);
                        const y = 120 + r * Math.sin((tickAngle * Math.PI) / 180);
                        return (
                            <text key={val} x={x} y={y} textAnchor="middle" fill={i === 5 ? '#EF4444' : '#4B5563'} className="text-[8px] font-black italic">
                                {val}
                            </text>
                        );
                    })}

                    {/* Digital Readout */}
                    <g transform="translate(100, 115)">
                        <text textAnchor="middle" fill="white" className="text-[20px] font-black italic tracking-tighter" filter="url(#neonGlow)">
                            {percentage.toFixed(0)}
                        </text>
                        <text y="15" textAnchor="middle" fill={getStatusColor()} className="text-[8px] font-black uppercase tracking-[0.4em] animate-pulse">
                            % RPM
                        </text>
                    </g>

                    {/* Red Line Area Mark */}
                    <path d="M 160 80 L 180 120" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="2 2" opacity="0.5" />

                    {/* Needle */}
                    <g transform={`rotate(${angle}, 100, 120)`} className="transition-transform duration-1000 ease-out">
                        <line
                            x1="100"
                            y1="120"
                            x2="25"
                            y2="120"
                            stroke={getStatusColor()}
                            strokeWidth="4"
                            strokeLinecap="round"
                            filter="url(#neonGlow)"
                        />
                        {/* Center Cap */}
                        <circle cx="100" cy="120" r="10" fill="#0b1221" stroke={getStatusColor()} strokeWidth="2" />
                        <circle cx="100" cy="120" r="4" fill={getStatusColor()} />
                    </g>
                </svg>
            </div>

            <div className="mt-4 text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                    <div className={`w-2 h-2 rounded-full ${percentage > 100 ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`}></div>
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">
                        {percentage > 100 ? 'ENGINE OVERHEAT' : 'CRUISING SPEED'}
                    </span>
                </div>
                <p className="text-[11px] font-bold text-fin-muted max-w-[180px] mx-auto leading-tight uppercase tabular-nums">
                    Budget: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(budgeted)}
                </p>
            </div>
        </div>
    );
};
