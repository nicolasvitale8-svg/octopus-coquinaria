/**
 * Google Calendar CSV Export Service
 * Genera CSV compatible con Google Calendar para importación directa
 */

import { CalendarEvent, BusinessType, EventTag, BUSINESS_TYPE_LABELS, EVENT_TAG_LABELS } from './calendarService';

/**
 * Construye la descripción del evento para Google Calendar
 * Incluye: tipo, tags, business types, y notas (H-72, H-24, Día D, etc.)
 */
export function buildDescription(event: CalendarEvent): string {
    const typeLabel = event.type.toUpperCase();

    // Mapear tags a sus labels legibles
    const tagsLine = event.tags?.length
        ? `Tags: ${event.tags.map(t => EVENT_TAG_LABELS[t] || t).join(', ')}`
        : '';

    // Mapear business types a sus labels legibles
    const bizLine = event.business_types?.length
        ? `Negocios objetivo: ${event.business_types.map(b => BUSINESS_TYPE_LABELS[b] || b).join(', ')}`
        : '';

    const lines = [
        `Tipo: ${typeLabel}`,
        tagsLine,
        bizLine,
        '', // Línea vacía antes de las notas
        event.description || ''
    ].filter(line => line !== undefined);

    return lines.join('\n').trim();
}

/**
 * Escapa un valor para CSV (maneja comillas y comas)
 */
function escapeCSVField(value: string): string {
    if (!value) return '';

    // Si contiene comillas, comas o saltos de línea, envolver en comillas
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
        // Escapar comillas dobles duplicándolas
        const escaped = value.replace(/"/g, '""');
        return `"${escaped}"`;
    }

    return value;
}

/**
 * Genera el contenido CSV completo para Google Calendar
 */
export function generateGoogleCalendarCSV(events: CalendarEvent[], locationName: string = ''): string {
    // Headers oficiales de Google Calendar
    const headers = [
        'Subject',
        'Start Date',
        'Start Time',
        'End Date',
        'End Time',
        'All Day Event',
        'Description',
        'Location',
        'Private'
    ];

    const rows: string[] = [headers.join(',')];

    for (const event of events) {
        // Formatear fecha a YYYY-MM-DD
        const startDate = event.start_date.split('T')[0]; // Por si viene con hora
        const endDate = (event.end_date || event.start_date).split('T')[0];

        const row = [
            escapeCSVField(event.title),           // Subject
            startDate,                              // Start Date (YYYY-MM-DD)
            '',                                     // Start Time (vacío = all-day)
            endDate,                                // End Date
            '',                                     // End Time (vacío)
            'True',                                 // All Day Event
            escapeCSVField(buildDescription(event)), // Description
            escapeCSVField(locationName),           // Location
            'True'                                  // Private
        ];

        rows.push(row.join(','));
    }

    return rows.join('\r\n'); // CRLF para máxima compatibilidad
}

/**
 * Dispara la descarga del archivo CSV
 */
export function downloadCSV(csvContent: string, filename: string): void {
    // BOM para UTF-8 (ayuda a Excel y otras apps a detectar encoding)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Exporta eventos del calendario a CSV y dispara descarga
 */
export function exportCalendarToGoogleCSV(
    events: CalendarEvent[],
    year?: number,
    projectName: string = ''
): void {
    // Filtrar por año si se especifica
    let filteredEvents = events;
    if (year) {
        filteredEvents = events.filter(e => {
            const eventYear = new Date(e.start_date).getFullYear();
            return eventYear === year;
        });
    }

    if (filteredEvents.length === 0) {
        alert('No hay eventos para exportar en el período seleccionado.');
        return;
    }

    const csvContent = generateGoogleCalendarCSV(filteredEvents, projectName);
    const filename = year
        ? `octopus-calendar-${year}.csv`
        : `octopus-calendar-${new Date().toISOString().split('T')[0]}.csv`;

    downloadCSV(csvContent, filename);
}
