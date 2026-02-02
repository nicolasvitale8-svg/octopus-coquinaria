// Document Generator Types for Academia Octopus

export interface DocumentMetadata {
    code: string;           // OCT-ACA-GUI-001
    version: string;        // 1.0
    title: string;          // Por dónde empezar en la Academia Octopus
    type: DocumentType;     // GUI, PRO, EDI, etc.
    date: string;           // 04/01/2026
    status: DocumentStatus; // VIGENTE, BORRADOR, OBSOLETO
    owner: string;          // Octopus Coquinaria
    access: AccessLevel;    // PUBLIC, PRIVATE
    reference: string;      // ISO 9001:2015 (7.5 / 8.1 / 10.3)
}

export type DocumentType = 'GUI' | 'PRO' | 'EDI' | 'MAN' | 'FIC' | 'CER';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    GUI: 'Guía',
    PRO: 'Procedimiento',
    EDI: 'Editorial',
    MAN: 'Manual',
    FIC: 'Ficha Técnica',
    CER: 'Certificado'
};

export type DocumentStatus = 'VIGENTE' | 'BORRADOR' | 'OBSOLETO' | 'EN REVISIÓN';

export type AccessLevel = 'PUBLIC' | 'PRIVATE' | 'INTERNAL';

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
    PUBLIC: 'PUBLIC (Free)',
    PRIVATE: 'PRIVATE',
    INTERNAL: 'INTERNAL'
};

export interface ChangeLogEntry {
    version: string;
    change: string;
    date: string;
}

export interface DocumentData {
    metadata: DocumentMetadata;
    content: string;  // Markdown content
    changeLog: ChangeLogEntry[];
    approvals: {
        elaboratedBy: string;
        reviewedBy: string;
        approvedBy: string;
    };
}

// Generate document code
export const generateDocumentCode = (type: DocumentType, number: number): string => {
    return `OCT-ACA-${type}-${String(number).padStart(3, '0')}`;
};

// Get today's date formatted
export const getTodayFormatted = (): string => {
    const today = new Date();
    return today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Default metadata
export const getDefaultMetadata = (): DocumentMetadata => ({
    code: generateDocumentCode('GUI', 1),
    version: '1.0',
    title: '',
    type: 'GUI',
    date: getTodayFormatted(),
    status: 'BORRADOR',
    owner: 'Octopus Coquinaria',
    access: 'PUBLIC',
    reference: 'ISO 9001:2015 (7.5 / 8.1 / 10.3)'
});

// Default document
export const getDefaultDocument = (): DocumentData => ({
    metadata: getDefaultMetadata(),
    content: `# Título del Documento

## Introducción

Escribí acá tu contenido en **Markdown**.

## Sección Principal

- Item 1
- Item 2
- Item 3

> 💡 Esto es una cita o nota importante.

## Conclusión

Cierre del documento.
`,
    changeLog: [
        { version: '1.0', change: 'Versión inicial', date: getTodayFormatted() }
    ],
    approvals: {
        elaboratedBy: '',
        reviewedBy: '',
        approvedBy: ''
    }
});
