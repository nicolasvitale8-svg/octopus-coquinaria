import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface GaugeProps {
    value: number;
    min?: number;
    max?: number;
    label: string;
    color?: string;
    unit?: string;
    className?: string;
}

export const SemiCircleGauge: React.FC<GaugeProps> = ({
    value,
    min = 0,
    max = 100,
    label,
    color = '#1FB6D5',
    unit = '%',
    className = ''
}) => {
    // Normalize value for the gauge (0-100)
    const normalizedValue = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

    const data = [
        { value: normalizedValue },
        { value: 100 - normalizedValue },
    ];

    return (
        <div className={`relative flex flex-col items-center justify-center ${className}`}>
            <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius="65%"
                            outerRadius="95%"
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                            animationBegin={0}
                            animationDuration={1500}
                        >
                            <Cell fill={color} />
                            <Cell fill="#1e293b" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="absolute top-[60%] left-1/2 -translate-x-1/2 text-center">
                <span className="text-5xl font-black text-white font-mono tracking-tighter shadow-sm">
                    {value.toFixed(1)}{unit}
                </span>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-2">{label}</p>
            </div>
        </div>
    );
};

export const MiniProgressRing: React.FC<{ value: number; label: string; color?: string }> = ({
    value,
    label,
    color = '#1FB6D5'
}) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
            <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                    <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        className="text-slate-800"
                    />
                    <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke={color}
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={circumference}
                        style={{ strokeDashoffset: offset }}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <span className="absolute text-[10px] font-bold text-white">{Math.round(value)}%</span>
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</p>
                <p className="text-sm font-bold text-white">Salud</p>
            </div>
        </div>
    );
};
