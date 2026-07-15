import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * LoadingScreen — barra de progreso estilo Minecraft (técnica, no estética):
 * - Barra de llenado segmentada con progreso "optimista" (avanza rápido al
 *   principio y desacelera cerca del 90%, salta a 100% al desmontar).
 * - Frases aleatorias rotando debajo, para entretener y bajar la ansiedad
 *   percibida durante la carga.
 * Mantiene la estética HUD/fósforo de Cephalopod.
 */

const FRASES = [
    'Afilando cuchillos…',
    'Contando el stock de la cámara…',
    'Cerrando la caja del día…',
    'Puliendo copas…',
    'Costeando recetas al gramo…',
    'Persiguiendo al proveedor de verduras…',
    'Precalentando el horno a 180°…',
    'Revisando la mise en place…',
    'Anotando la comanda…',
    'Cuadrando el arqueo…',
    'Rotando stock: FIFO, siempre FIFO…',
    'Etiquetando tuppers…',
    'Desglasando la sartén…',
    'Calibrando la balanza…',
    'Despertando al pulpo…',
    'Cargando tentáculos…',
    'Ordenando la cámara por familias…',
    'Cerrando la merma del día…',
];

const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

interface LoadingScreenProps {
    /** Título mono arriba de la barra (default: módulo genérico) */
    title?: string;
    /** Ocupa toda la pantalla (module loading) o solo el bloque (in-page) */
    fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ title = 'Cephalopod OS', fullScreen = true }) => {
    const [progress, setProgress] = useState(4);
    const [phraseIdx, setPhraseIdx] = useState(0);
    const frases = useMemo(() => shuffle(FRASES), []);
    const raf = useRef<number>();

    // Progreso optimista: rápido hasta ~60%, lento hasta ~92%, nunca llega a 100 solo.
    useEffect(() => {
        let value = 4;
        let last = performance.now();
        const tick = (now: number) => {
            const dt = (now - last) / 1000;
            last = now;
            const speed = value < 60 ? 38 : value < 85 ? 9 : value < 92 ? 2.5 : 0;
            value = Math.min(92, value + speed * dt);
            setProgress(value);
            raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    }, []);

    // Rotación de frases cada 2 segundos
    useEffect(() => {
        const id = setInterval(() => setPhraseIdx(i => (i + 1) % frases.length), 2000);
        return () => clearInterval(id);
    }, [frases.length]);

    const SEGMENTS = 24;
    const filled = Math.round((progress / 100) * SEGMENTS);

    const bar = (
        <div className="relative text-center space-y-5 w-full max-w-md px-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: 'var(--color-primary)' }}>
                ▸ {title}
            </p>

            {/* Barra segmentada estilo Minecraft */}
            <div
                className="relative w-full h-6 p-[3px] flex gap-[3px]"
                style={{ border: '2px solid var(--color-primary)', boxShadow: '0 0 18px rgba(0,255,157,0.25), inset 0 0 8px rgba(0,255,157,0.08)' }}
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                {Array.from({ length: SEGMENTS }).map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 transition-opacity duration-200"
                        style={{
                            background: 'var(--color-primary)',
                            opacity: i < filled ? (i === filled - 1 ? 0.7 : 1) : 0.07,
                        }}
                    />
                ))}
            </div>

            {/* Porcentaje + frase aleatoria */}
            <div className="space-y-2">
                <p className="font-mono text-[10px] tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
                    {Math.round(progress)}%
                </p>
                <p key={phraseIdx} className="font-mono text-xs" style={{ color: 'var(--text-muted)', animation: 'cpdFadeIn 0.35s ease' }}>
                    {frases[phraseIdx]}
                </p>
            </div>

            <style>{`@keyframes cpdFadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }`}</style>
        </div>
    );

    if (!fullScreen) {
        return <div className="flex items-center justify-center py-24">{bar}</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative" style={{ background: 'var(--bg-base)' }}>
            {/* HUD grid backdrop */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />
            {/* Corner reticles */}
            <span aria-hidden="true" className="absolute top-4 left-4 w-5 h-5 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="absolute top-4 right-4 w-5 h-5 border-r border-t" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="absolute bottom-4 left-4 w-5 h-5 border-l border-b" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="absolute bottom-4 right-4 w-5 h-5 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />
            {bar}
        </div>
    );
};

export default LoadingScreen;
