
import { AcademyResource, LearningPath, GastronomicEvent } from './types';

export const WHATSAPP_NUMBER = "5493517736981";
export const DISPLAY_PHONE = "+54 9 351 773-6981";
export const CONTACT_EMAIL = "octopuscoquinaria@gmail.com";
export const INSTAGRAM_URL = "https://www.instagram.com/octopuscuquinaria/";
export const YOUTUBE_URL = "https://www.youtube.com/@octopuscoquinaria";
export const APP_NAME = "Octopus Coquinaria";
export const LINKEDIN_URL = "https://www.linkedin.com/";

// --- ASSETS VISUALES (URLs Externas) ---
// --- ASSETS VISUALES (URLs Externas) ---
export const GLOBAL_LOGO_URL = "https://i.postimg.cc/C1240jfz/logo_completo.png"; // Fallback legacy
export const LOGO_ADMIN_URL = "https://i.postimg.cc/6pJzVPf7/pulpo-admin-transparente.png";
export const LOGO_USER_URL = "https://i.postimg.cc/90wtZP42/pulpo-usuario-transparente.png";
export const LOGO_GUEST_URL = "https://i.postimg.cc/137dGBXM/pulpo-guest-transparente-v2.png";

export const GLOBAL_BACKGROUND_IMAGE_URL = "https://i.postimg.cc/dt6jtPdV/fondo_abismo_azul.png";
export const BRAND_ILLUSTRATION_URL = "https://i.postimg.cc/dVtPLYx4/pulpo_completo_transparente.png";
export const NICOLAS_PHOTO_URL = "https://i.postimg.cc/ht9zPVN8/Generated_Image_September_05_2025_2_20PM.jpg";

export const COLIFA_MENU_URL = "https://drive.google.com/file/d/12x0CoM4lYMKMNSQWtNxPEEtT2eAMiCX4/view?usp=drive_link";
export const TECHNICAL_SHEETS_EXAMPLE_URL = "https://drive.google.com/file/d/1vfOyn2-cQ2ZKH6EDxbrL6RhCCbR65QEe/view?usp=sharing";
export const PROCESS_EXAMPLE_URL = "https://drive.google.com/file/d/18--dvReEprD_5RN3Q2llxn6Nw8giqeFt/view?usp=sharing";

// --- SUPABASE CONFIGURATION ---
// Configuración inyectada automáticamente.
export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "https://hmyzuuujyurvyuusvyzp.supabase.co";
export const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteXp1dXVqeXVydnl1dXN2eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDUyMjgsImV4cCI6MjA4MDI4MTIyOH0.PSXTNZoGg2alqdtlGuluWsvMbu2dnGIJuxjdGPCTWrQ";

// --- METHODOLOGY DATA ---
export const METHODOLOGY_7P = [
  {
    id: 'orden',
    key: 'O',
    letter: 'Orden',
    tagline: 'La base de la pirámide',
    description: 'Sin orden no hay datos, y sin datos no hay decisiones. El orden no es limpieza, es estructura.',
    importance: ['Evita robos y desperdicios', 'Genera paz mental al dueño', 'Permite delegar tareas'],
    symptoms: ['Caja nunca cuadra', 'Depósitos caóticos', 'Roles poco claros'],
    actions: ['Checklists de apertura/cierre', 'Organigrama funcional', 'Inventarios ciegos'],
    pills: ['Si no está escrito, no existe.', 'El orden le gana al talento.']
  },
  {
    id: 'creatividad',
    key: 'C',
    letter: 'Creatividad',
    tagline: 'Diferenciación estratégica',
    description: 'No es inventar platos raros. Es resolver problemas de consumo de forma ingeniosa y rentable.',
    importance: ['Te separa de la competencia', 'Justifica precios más altos', 'Fideliza clientes'],
    symptoms: ['Carta aburrida o copiada', 'Ventas estancadas', 'Poca identidad de marca'],
    actions: ['Ingeniería de menú', 'Diseño de experiencias', 'Branding gastronómico'],
    pills: ['Creatividad sin rentabilidad es arte, no negocio.', 'Copiá bien o innová mejor.']
  },
  {
    id: 'tecnologia',
    key: 'T',
    letter: 'Tecnología',
    tagline: 'Apalancamiento digital',
    description: 'Usar herramientas para medir, controlar y agilizar. Dejar el papel y la memoria.',
    importance: ['Datos en tiempo real', 'Menor error humano', 'Escalabilidad'],
    symptoms: ['Todo en cuadernos', 'Comandas a gritos', 'No hay base de clientes'],
    actions: ['Sistema de gestión (POS)', 'Reservas online', 'Planillas inteligentes'],
    pills: ['Lo que no se mide, no se gestiona.', 'Tu POS es tu mejor empleado.']
  },
  {
    id: 'observacion',
    key: 'O_obs',
    letter: 'Observación',
    tagline: 'Auditoría constante',
    description: 'La capacidad de ver lo que pasa realmente en el salón y la cocina, no lo que creemos que pasa.',
    importance: ['Detección temprana de fallas', 'Control de calidad', 'Feedback real'],
    symptoms: ['Dueño ciego a errores', 'Clientes no vuelven', 'Platos salen distintos'],
    actions: ['Mistery Shopper', 'Encuestas de satisfacción', 'Recorridas de servicio'],
    pills: ['El ojo del amo engorda el ganado, si el amo sabe mirar.', 'Mirá los platos que vuelven a la bacha.']
  },
  {
    id: 'pragmatismo',
    key: 'P',
    letter: 'Pragmatismo',
    tagline: 'Ejecución sobre perfección',
    description: 'Resolver problemas hoy con lo que tenemos. Priorizar la rentabilidad y la operatividad.',
    importance: ['Velocidad de respuesta', 'Foco en resultados', 'Adaptabilidad'],
    symptoms: ['Proyectos eternos sin lanzar', 'Exceso de burocracia', 'Perfeccionismo paralizante'],
    actions: ['Regla 80/20', 'Soluciones MVP', 'Decisiones basadas en margen'],
    pills: ['Hecho es mejor que perfecto.', 'La rentabilidad manda.']
  },
  {
    id: 'universalidad',
    key: 'U',
    letter: 'Universalidad',
    tagline: 'Modelo replicable',
    description: 'Crear sistemas que funcionen independientemente de las personas específicas que los operan.',
    importance: ['Permite franquiciar', 'Facilita rotación de personal', 'Valor de venta del negocio'],
    symptoms: ['"Si no estoy yo, se cae"', 'Recetas "a ojo"', 'Dependencia de "estrellas"'],
    actions: ['Estandarización de recetas', 'Manuales operativos', 'Procesos a prueba de tontos'],
    pills: ['Construí sistemas, no dependas de héroes.', 'Tu negocio debe poder funcionar sin vos.']
  },
  {
    id: 'sutileza',
    key: 'S',
    letter: 'Sutileza',
    tagline: 'El detalle invisible',
    description: 'Esos pequeños toques que el cliente no sabe explicar pero que lo hacen volver. Hospitalidad pura.',
    importance: ['Valor percibido alto', 'Experiencia memorable', 'Boca a boca potente'],
    symptoms: ['Servicio robotizado', 'Ambiente frío', 'Descuido en baños/limpieza'],
    actions: ['Protocolos de bienvenida', 'Música e iluminación', 'Detalles sorpresa'],
    pills: ['Dios está en los detalles.', 'La hospitalidad es un sentimiento.']
  }
];

// --- MOCK DATA ---
export const ACADEMY_RESOURCES: AcademyResource[] = [
  {
    id: '1',
    title: 'Cómo calcular tu Costo de Mercadería (CMV) Real',
    type: 'video',
    duration: '12 min',
    topics: ['finanzas', 'operaciones'],
    letters7p: ['O', 'T'],
    summary: 'Dejá de adivinar. Aprendé la fórmula exacta para saber cuánto te cuesta cada plato.',
    description: 'La mayoría de los gastronómicos confunde compras con costo. En este video explicamos la diferencia vital entre lo que pagás y lo que realmente consumís (Inventario Inicial + Compras - Inventario Final). Incluye planilla descargable.',
    idealFor: ['Dueños', 'Gerentes', 'Jefes de Cocina'],
    actionSteps: ['Hacé un inventario general hoy.', 'Registrá todas las compras del mes.', 'Aplicá la fórmula (II + C - IF) / Venta.'],
    recommendedTrigger: ['high_cogs'],
    youtubeId: 'xyz123'
  },
  {
    id: '2',
    title: 'Checklist de Apertura y Cierre: Tu salvavidas',
    type: 'template',
    duration: 'Lectura 5 min',
    topics: ['operaciones', 'equipo'],
    letters7p: ['O', 'U'],
    summary: 'Plantilla lista para imprimir que asegura que tu local abra y cierre perfecto siempre.',
    description: 'El caos operativo empieza cuando cada uno hace las cosas "a su manera". Estandarizá el inicio y fin del día con esta herramienta simple pero poderosa. Si no está tildado, no está hecho.',
    idealFor: ['Encargados', 'Camareros', 'Cocineros'],
    actionSteps: ['Descargá el PDF.', 'Adaptalo a tus horarios.', 'Pegalo en una tabla y usalo mañana.'],
    recommendedTrigger: ['low_order'],
    downloadUrl: '/files/checklist-apertura.pdf'
  },
  {
    id: '3',
    title: 'Ingeniería de Menú: Vendé lo que te conviene',
    type: 'guide',
    duration: 'Lectura 15 min',
    topics: ['marketing', 'finanzas'],
    letters7p: ['C', 'P'],
    summary: 'Cómo diseñar tu carta para dirigir la venta hacia tus platos más rentables (Estrellas).',
    description: 'Tu carta no es una lista de precios, es tu principal herramienta de venta. Aprendé a clasificar tus platos en Estrellas, Caballitos de Batalla, Puzzles y Perros, y qué hacer con cada uno.',
    idealFor: ['Dueños', 'Chefs'],
    actionSteps: ['Calculá el margen de cada plato.', 'Mide la popularidad (cantidad vendida).', 'Rediseñá el menú destacando los Estrellas.'],
    recommendedTrigger: ['low_margin']
  }
];

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'finanzas-basicas',
    title: 'Finanzas para no Financieros',
    description: 'Ordená los números de tu restaurante en 3 pasos simples.',
    resourceIds: ['1', '3']
  },
  {
    id: 'operacion-blindada',
    title: 'Operación Blindada',
    description: 'Sistemas para que el negocio funcione sin que estés encima.',
    resourceIds: ['2']
  }
];

export const MOCK_HISTORY = [
  { month: 'Ene', sales: 12000000, cogs: 38, labor: 22, result: 12, isReal: true },
  { month: 'Feb', sales: 11500000, cogs: 36, labor: 24, result: 14, isReal: true },
  { month: 'Mar', sales: 13200000, cogs: 34, labor: 21, result: 18, isReal: true },
];

export const GASTRONOMIC_EVENTS: GastronomicEvent[] = [
  {
    id: 'evt-1',
    tipo: 'feriado_nacional',
    fecha_inicio: '2025-05-01',
    fecha_fin: '2025-05-01',
    mensaje: 'Día del Trabajador: Ojo con costos laborales dobles.',
    prioridad: 2,
    visible_desde: '2025-04-20',
    visible_hasta: '2025-05-01'
  },
  {
    id: 'evt-2',
    tipo: 'clima',
    fecha_inicio: '2025-02-15',
    fecha_fin: '2025-02-17',
    mensaje: 'Alerta Ola de Calor: Reforzar stock de bebidas y hielo.',
    prioridad: 3,
    visible_desde: '2025-02-10',
    visible_hasta: '2025-02-17'
  },
  {
    id: 'evt-3',
    tipo: 'precios_insumos',
    fecha_inicio: '2025-03-01',
    fecha_fin: '2025-03-05',
    mensaje: 'Aumento estacional de lácteos esperado (+15%).',
    prioridad: 2,
    visible_desde: '2025-02-20',
    visible_hasta: '2025-03-05'
  },
  {
    id: 'evt-4',
    tipo: 'tendencia_consumo',
    fecha_inicio: '2025-01-01',
    fecha_fin: '2025-12-31',
    mensaje: 'Tendencia 2025: Crecimiento de vermutería y platitos.',
    prioridad: 1,
    visible_desde: '2025-01-01',
    visible_hasta: '2025-06-30'
  }
];