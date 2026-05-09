/**
 * jobTitles.ts — Opciones de cargo / puesto para gastronomía.
 * Se usan en UserProfile (perfil propio) y AdminUserModal (admin edita ficha).
 * El value 'OTRO' habilita un input libre.
 */

export interface JobTitleOption {
  value: string;
  label: string;
}

export const JOB_TITLES: JobTitleOption[] = [
  { value: 'DIRECTOR',       label: 'Director / Dueño' },
  { value: 'GERENTE',        label: 'Gerente General' },
  { value: 'ENCARGADO',      label: 'Encargado / Jefe de Local' },
  { value: 'CHEF',           label: 'Chef / Jefe de Cocina' },
  { value: 'SOUS_CHEF',      label: 'Sous Chef' },
  { value: 'COCINERO',       label: 'Cocinero' },
  { value: 'BACHERO',        label: 'Bachero / Plonge' },
  { value: 'MOZO',           label: 'Mozo / Camarero' },
  { value: 'BARRA',          label: 'Bartender / Barra' },
  { value: 'CAJERO',         label: 'Cajero' },
  { value: 'AUDITOR',        label: 'Auditor / Asesor' },
  { value: 'CONSULTOR',      label: 'Consultor' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo / RRHH' },
  { value: 'COMPRAS',        label: 'Compras / Proveeduría' },
  { value: 'MARKETING',      label: 'Marketing / Comunicación' },
  { value: 'OTRO',           label: 'Otro (especificar)' }
];

/** Helper: dado el value devuelve el label, fallback al value mismo. */
export const getJobTitleLabel = (value: string | null | undefined): string => {
  if (!value) return '';
  const opt = JOB_TITLES.find(o => o.value === value);
  return opt ? opt.label : value;
};

/** Helper: indica si un string es un value canónico (vs texto libre). */
export const isCanonicalJobTitle = (value: string | null | undefined): boolean => {
  if (!value) return false;
  return JOB_TITLES.some(o => o.value === value);
};
