import React from 'react';

/**
 * OctopusMark — isotipo phosphor-circuit de Octopus Coquinaria · FASE 2.
 *
 * Reemplaza la versión lineal hand-drawn por el vector oficial del
 * brand board (cephalopod circuit-board logo).
 *
 * Diseño: octágono superior (mantle) + 8 tentáculos en circuit-trace
 * descendente, terminando en pads/dots. Pixel-snap deliberado para
 * reforzar la estética terminal/HUD.
 *
 * Variants:
 *  - "mono"     → todo currentColor. Para sidebar, botones, favicon,
 *                 icon dentro de texto. Heredá color con
 *                 text-[var(--color-primary)], text-text-primary, etc.
 *  - "duotone"  → fill phosphor green forzado, ignorando currentColor.
 *                 Para hero, splash, login, loader full-screen.
 *  - "phosphor" → alias de duotone con glow más intenso.
 *
 * Tamaño:
 *  - `size` numérico → ancho y alto en px.
 *  - sin size        → 100% del contenedor.
 *
 * Animación:
 *  - `animated` (boolean) → phosphor-pulse (drop-shadow + opacity).
 */

export interface OctopusMarkProps extends React.SVGAttributes<SVGSVGElement> {
  variant?: 'mono' | 'duotone' | 'phosphor';
  size?: number;
  animated?: boolean;
  title?: string;
}

// Path data del logo oficial (cephalopod-logo.svg).
// Single path, fill-rule evenodd, viewBox 0 0 1000 1000.
const LOGO_PATH = `M 796.00 562.00 L 792.00 570.00 L 796.00 586.00 L 808.00 586.00 L 812.00 570.00 Z
M 184.00 566.00 L 184.00 582.00 L 200.00 586.00 L 200.00 562.00 Z
M 796.00 498.00 L 792.00 522.00 L 808.00 522.00 L 812.00 502.00 Z
M 188.00 498.00 L 184.00 522.00 L 200.00 522.00 L 200.00 502.00 Z
M 672.00 450.00 L 672.00 470.00 L 724.00 522.00 L 724.00 614.00 L 788.00 678.00 L 804.00 674.00 L 744.00 610.00 L 744.00 514.00 L 680.00 450.00 Z
M 324.00 450.00 L 316.00 450.00 L 252.00 510.00 L 252.00 614.00 L 196.00 666.00 L 200.00 678.00 L 224.00 666.00 L 272.00 610.00 L 272.00 522.00 L 324.00 470.00 Z
M 496.00 398.00 L 488.00 406.00 L 488.00 418.00 L 508.00 422.00 L 512.00 406.00 Z
M 640.00 386.00 L 612.00 414.00 L 612.00 510.00 L 664.00 558.00 L 664.00 638.00 L 716.00 690.00 L 716.00 758.00 L 724.00 758.00 L 740.00 742.00 L 740.00 682.00 L 684.00 626.00 L 684.00 546.00 L 636.00 502.00 L 636.00 426.00 L 652.00 410.00 L 652.00 390.00 Z
M 356.00 386.00 L 340.00 398.00 L 340.00 406.00 L 360.00 426.00 L 360.00 502.00 L 312.00 546.00 L 312.00 606.00 L 308.00 610.00 L 312.00 626.00 L 256.00 682.00 L 256.00 742.00 L 276.00 758.00 L 280.00 754.00 L 280.00 690.00 L 332.00 638.00 L 332.00 558.00 L 384.00 506.00 L 384.00 414.00 Z
M 448.00 114.00 L 356.00 206.00 L 356.00 326.00 L 420.00 390.00 L 420.00 486.00 L 444.00 510.00 L 444.00 518.00 L 372.00 586.00 L 372.00 686.00 L 324.00 734.00 L 324.00 810.00 L 348.00 830.00 L 348.00 742.00 L 396.00 694.00 L 396.00 598.00 L 452.00 546.00 L 460.00 562.00 L 456.00 682.00 L 392.00 746.00 L 388.00 826.00 L 440.00 878.00 L 456.00 878.00 L 456.00 862.00 L 416.00 822.00 L 412.00 790.00 L 420.00 754.00 L 484.00 690.00 L 480.00 670.00 L 484.00 662.00 L 480.00 650.00 L 484.00 510.00 L 448.00 474.00 L 448.00 382.00 L 444.00 374.00 L 384.00 318.00 L 384.00 222.00 L 456.00 150.00 L 532.00 146.00 L 608.00 218.00 L 608.00 318.00 L 548.00 378.00 L 548.00 478.00 L 512.00 514.00 L 512.00 694.00 L 580.00 758.00 L 580.00 822.00 L 540.00 858.00 L 540.00 878.00 L 552.00 882.00 L 604.00 830.00 L 604.00 746.00 L 536.00 678.00 L 536.00 550.00 L 540.00 546.00 L 600.00 598.00 L 600.00 698.00 L 648.00 742.00 L 648.00 830.00 L 672.00 810.00 L 668.00 730.00 L 624.00 686.00 L 624.00 626.00 L 620.00 622.00 L 624.00 590.00 L 552.00 518.00 L 576.00 482.00 L 576.00 418.00 L 572.00 414.00 L 576.00 390.00 L 640.00 322.00 L 640.00 210.00 L 548.00 114.00 Z`;

const OctopusMark: React.FC<OctopusMarkProps> = ({
  variant = 'mono',
  size,
  animated = false,
  title = 'Octopus Coquinaria',
  className = '',
  ...rest
}) => {
  const isDuotone = variant === 'duotone' || variant === 'phosphor';
  const isPhosphor = variant === 'phosphor';

  const fillColor = isDuotone ? '#00FF9D' : 'currentColor';

  const dimensions = size
    ? { width: size, height: size }
    : { width: '100%', height: '100%' };

  const animClass = animated ? 'animate-phosphor-pulse' : '';
  const filterStyle = isPhosphor
    ? { filter: 'drop-shadow(0 0 8px rgba(0, 255, 157, 0.55))' }
    : undefined;

  return (
    <svg
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={`${animClass} ${className}`.trim()}
      style={filterStyle}
      {...dimensions}
      {...rest}
    >
      <title>{title}</title>
      <path d={LOGO_PATH} fill={fillColor} fillRule="evenodd" />
    </svg>
  );
};

export default OctopusMark;
