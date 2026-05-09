import { supabase } from './supabase';

/**
 * avatarService — Helpers para subir/eliminar foto de perfil en Supabase Storage.
 * Bucket: 'avatars' (público). Path: '{userId}/avatar.{ext}'.
 *
 * Importante: requiere que el bucket 'avatars' exista y tenga policies que
 * permitan al usuario operar sobre la carpeta {auth.uid()}/. Ver
 * database/add_avatar_and_notes.sql para las policies sugeridas.
 */

const BUCKET = 'avatars';
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface AvatarUploadResult {
  url: string;
  path: string;
}

const extFromMime = (mime: string): string => {
  switch (mime) {
    case 'image/jpeg':
    case 'image/jpg': return 'jpg';
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    default: return 'jpg';
  }
};

/** Sube avatar de un usuario y devuelve URL pública. Sobreescribe el archivo previo. */
export const uploadAvatar = async (
  userId: string,
  file: File
): Promise<AvatarUploadResult> => {
  if (!supabase) throw new Error('Sin conexión a Supabase.');
  if (!userId) throw new Error('userId requerido.');
  if (!file) throw new Error('Archivo requerido.');

  if (!ACCEPTED_MIME.includes(file.type)) {
    throw new Error('Formato no permitido. Subí JPG, PNG o WEBP.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Imagen demasiado pesada. Máximo 2 MB.');
  }

  const ext = extFromMime(file.type);
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type
    });

  if (uploadError) throw uploadError;

  // URL pública con cache-buster para que se refresque sin recargar
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('No se obtuvo URL pública del avatar.');

  const url = `${data.publicUrl}?t=${Date.now()}`;
  return { url, path };
};

/** Persiste la URL del avatar en usuarios.avatar_url. */
export const saveAvatarUrl = async (userId: string, avatarUrl: string | null): Promise<void> => {
  if (!supabase) throw new Error('Sin conexión a Supabase.');
  const { error } = await supabase
    .from('usuarios')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);
  if (error) throw error;
};

/** Borra todos los archivos de avatar del usuario y limpia avatar_url. */
export const deleteAvatar = async (userId: string): Promise<void> => {
  if (!supabase) throw new Error('Sin conexión a Supabase.');
  // Listar archivos en la carpeta del usuario
  const { data: list } = await supabase.storage.from(BUCKET).list(userId);
  if (list && list.length > 0) {
    const paths = list.map(f => `${userId}/${f.name}`);
    await supabase.storage.from(BUCKET).remove(paths);
  }
  await saveAvatarUrl(userId, null);
};

export const AVATAR_LIMITS = { MAX_BYTES, ACCEPTED_MIME };
