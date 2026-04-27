import React from 'react';

/**
 * OctopusMark — isotipo lineal de Octopus Coquinaria.
 *
 * Diseño: pulpo lineal estilo placa-circuito. Cabeza (mantle) elíptica,
 * 6 tentáculos asimétricos curvados en S, nodos circulares en las puntas
 * y conectores punteados entre nodos. Inspirado en circuit-boards: la
 * intuición + lo sistémico (mar + datos).
 *
 * Variants:
 *  - "mono"     → todo currentColor. Para sidebar, botones, favicon, icon
 *                 dentro de texto. Heredá color con text-gold, text-cream,
 *                 text-text-secondary, etc.
 *  - "duotone"  → mantle/tentáculos en gold + nodos en cyan-tech. Para
 *                 hero, loader, splash, login. Ignora `currentColor`.
 *
 * Tamaño:
 *  - `size` numérico → ancho y alto en px.
 *  - sin size        → 100% del contenedor (heredá w-X h-X de tailwind).
 *
 * Animación:
 *  - `animated` (boolean) → pulsación sutil para loaders.
 */

export interface OctopusMarkProps extends React.SVGAttributes<SVGSVGElement> {
  variant?: 'mono' | 'duotone';
  size?: number;
  animated?: boolean;
  title?: string;
}

const OctopusMark: React.FC<OctopusMarkProps> = ({
  variant = 'mono',
  size,
  animated = false,
  title = 'Octopus Coquinaria',
  className = '',
  ...rest
}) => {
  const isDuotone = variant === 'duotone';

  const strokeColor = isDuotone ? '#D4B681' /* gold */ : 'currentColor';
  const nodeColor   = isDuotone ? '#1FB6D5' /* cyan-tech */ : 'currentColor';
  const eyeColor    = isDuotone ? '#1A1308' : 'currentColor';
  const connectorColor = isDuotone ? '#D4B681' : 'currentColor';

  const dimensions = size
    ? { width: size, height: size }
    : { width: '100%', height: '100%' };

  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      role="img"
      aria-label={title}
      className={`${animated ? 'animate-octopus-pulse' : ''} ${className}`}
      {...dimensions}
      {...rest}
    >
      <title>{title}</title>

      {/* Mantle / cabeza */}
      <ellipse
        cx="32"
        cy="22"
        rx="14"
        ry="13"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Detalle interno: arco superior (textura sistema) */}
      <path
        d="M22 18 Q32 12 42 18"
        stroke={strokeColor}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Ojos */}
      <circle cx="27" cy="23" r="1.6" fill={eyeColor} />
      <circle cx="37" cy="23" r="1.6" fill={eyeColor} />

      {/* 6 tentáculos saliendo de la base de la cabeza */}
      <g
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      >
        {/* Tentáculo 1 — extremo izq */}
        <path d="M19 33 C16 40, 13 46, 11 54" />
        {/* Tentáculo 2 */}
        <path d="M24 35 C22 43, 21 49, 20 57" />
        {/* Tentáculo 3 — centro-izq */}
        <path d="M29 36 C29 45, 29 51, 28 58" />
        {/* Tentáculo 4 — centro-der */}
        <path d="M35 36 C35 45, 35 51, 36 58" />
        {/* Tentáculo 5 */}
        <path d="M40 35 C42 43, 43 49, 44 57" />
        {/* Tentáculo 6 — extremo der */}
        <path d="M45 33 C48 40, 51 46, 53 54" />
      </g>

      {/* Conectores punteados (circuit) entre nodos vecinos */}
      <g
        stroke={connectorColor}
        strokeWidth="1"
        strokeDasharray="1.5 2.5"
        strokeLinecap="round"
        opacity="0.45"
      >
        <line x1="11" y1="54" x2="20" y2="57" />
        <line x1="20" y1="57" x2="28" y2="58" />
        <line x1="36" y1="58" x2="44" y2="57" />
        <line x1="44" y1="57" x2="53" y2="54" />
      </g>

      {/* Nodos (puntas de tentáculos) — el "circuito" */}
      <g fill={nodeColor}>
        <circle cx="11" cy="54" r="2.2" />
        <circle cx="20" cy="57" r="2.2" />
        <circle cx="28" cy="58" r="2.2" />
        <circle cx="36" cy="58" r="2.2" />
        <circle cx="44" cy="57" r="2.2" />
        <circle cx="53" cy="54" r="2.2" />
      </g>
    </svg>
  );
};

export default OctopusMark;
