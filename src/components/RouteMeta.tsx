import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * RouteMeta — títulos y descripciones por ruta para una SPA.
 * Un solo componente montado dentro del Router actualiza document.title
 * y la meta description según el pathname. Mejora CTR en buscadores y
 * hace legibles el historial y las pestañas.
 */

const BASE = 'Cephalopod';

const META: Record<string, { t: string; d?: string }> = {
    '/': {
        t: `${BASE} | Sistemas operativos para gastronomía`,
        d: 'Transformamos procesos, datos y documentación gastronómica en control y criterio operativo. Menos improvisación, más sistema.',
    },
    '/methodology': {
        t: `Metodología Octopus 7P · ${BASE}`,
        d: 'Siete principios que guían cada sistema: orden, creatividad, tecnología, observación, pragmatismo, universalidad y sutileza.',
    },
    '/services': {
        t: `Servicios · ${BASE}`,
        d: 'Control y números, orden y procesos, diseño de carta, compras y stock: soluciones operativas para gastronomía.',
    },
    '/cases': {
        t: `Casos de éxito · ${BASE}`,
        d: 'Resultados medibles aplicando la metodología 7P sobre operaciones gastronómicas reales.',
    },
    '/academy': {
        t: `Academia · ${BASE}`,
        d: 'Guías, herramientas y rutas de aprendizaje gratuitas para ordenar y escalar tu negocio gastronómico.',
    },
    '/about': { t: `Nosotros · ${BASE}` },
    '/quick-diagnostic': {
        t: `Diagnóstico Express gratis · ${BASE}`,
        d: 'Diagnóstico operativo gratuito en 5 minutos: descubrí dónde pierde plata tu negocio gastronómico.',
    },
    '/deep-diagnostic': { t: `Diagnóstico profundo · ${BASE}` },
    '/login': { t: `Iniciar sesión · ${BASE}` },
    '/calendar': { t: `Calendario · ${BASE}` },
};

export const RouteMeta = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        const meta = META[pathname]
            || (pathname.startsWith('/academy/') ? META['/academy'] : null)
            || (pathname.startsWith('/finance') ? { t: `FinanzaFlow · ${BASE}` } : null)
            || (pathname.startsWith('/admin') ? { t: `Admin · ${BASE}` } : null)
            || (pathname.startsWith('/hub') ? { t: `Mi proyecto · ${BASE}` } : null);

        document.title = meta?.t || META['/'].t;
        const tag = document.querySelector('meta[name="description"]');
        if (tag && meta?.d) tag.setAttribute('content', meta.d);
    }, [pathname]);

    return null;
};

export default RouteMeta;
