import React, { useRef, useState } from 'react';
import { Camera, Loader2, Trash2, User } from 'lucide-react';
import { uploadAvatar, saveAvatarUrl, deleteAvatar, AVATAR_LIMITS } from '../../services/avatarService';

/**
 * AvatarUploader — Componente HUD para subir/cambiar/borrar foto de perfil.
 * Sube a Supabase Storage bucket 'avatars' bajo carpeta del userId.
 * Persiste avatar_url en usuarios. Llama a onChange con la nueva URL (o null).
 *
 * Si el caller maneja un usuario aún no creado (sin id), sólo permite
 * previsualizar via URL.createObjectURL y devolver el File por onPickedFile.
 */

interface AvatarUploaderProps {
  userId?: string | null;       // Si existe, hace upload directo. Si no, sólo previsualiza.
  initialUrl?: string | null;
  fullName?: string;
  size?: number;                 // px, default 96
  onChange?: (newUrl: string | null) => void; // notifica cambio persistido
  onPickedFile?: (file: File | null) => void; // si no hay userId, devuelve el archivo elegido
  onError?: (message: string) => void;
  disabled?: boolean;
}

const initialsOf = (name?: string, fallback = '?'): string => {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  userId,
  initialUrl,
  fullName,
  size = 96,
  onChange,
  onPickedFile,
  onError,
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [busy, setBusy] = useState(false);

  const triggerPick = () => {
    if (disabled || busy) return;
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!AVATAR_LIMITS.ACCEPTED_MIME.includes(file.type)) {
      onError?.('Formato no permitido. JPG, PNG o WEBP.');
      return;
    }
    if (file.size > AVATAR_LIMITS.MAX_BYTES) {
      onError?.('Imagen demasiado pesada. Máximo 2 MB.');
      return;
    }

    // Sin userId: sólo preview + entregar File al caller
    if (!userId) {
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      onPickedFile?.(file);
      return;
    }

    // Con userId: upload directo + persistir URL
    setBusy(true);
    try {
      const { url } = await uploadAvatar(userId, file);
      await saveAvatarUrl(userId, url);
      setPreviewUrl(url);
      onChange?.(url);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      onError?.(err.message || 'No se pudo subir la foto.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (disabled || busy) return;
    if (!userId) {
      // Sin userId: limpiar preview local
      setPreviewUrl(null);
      onPickedFile?.(null);
      return;
    }
    if (!confirm('¿Quitar foto de perfil?')) return;
    setBusy(true);
    try {
      await deleteAvatar(userId);
      setPreviewUrl(null);
      onChange?.(null);
    } catch (err: any) {
      console.error('Avatar delete error:', err);
      onError?.(err.message || 'No se pudo eliminar la foto.');
    } finally {
      setBusy(false);
    }
  };

  const dim = `${size}px`;

  return (
    <div className="flex items-center gap-4">
      {/* Avatar circular HUD */}
      <div
        className="relative flex-shrink-0 group"
        style={{ width: dim, height: dim }}
      >
        <div
          className="absolute inset-0 border-2 overflow-hidden flex items-center justify-center"
          style={{
            background: 'var(--bg-base)',
            borderColor: 'var(--color-primary)',
            borderRadius: '50%'
          }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={fullName || 'Avatar'}
              className="w-full h-full object-cover"
              onError={() => setPreviewUrl(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
              {fullName ? (
                <span className="font-display font-bold" style={{ fontSize: size * 0.35, color: 'var(--color-primary)' }}>
                  {initialsOf(fullName)}
                </span>
              ) : (
                <User className="w-6 h-6" strokeWidth={1.5} />
              )}
            </div>
          )}
        </div>

        {/* Brackets HUD en cuatro esquinas, fuera del círculo */}
        <span aria-hidden="true" className="pointer-events-none absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2" style={{ borderColor: 'var(--color-primary)' }} />
        <span aria-hidden="true" className="pointer-events-none absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2" style={{ borderColor: 'var(--color-primary)' }} />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />

        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60" style={{ borderRadius: '50%' }}>
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-primary)' }} />
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={triggerPick}
          disabled={disabled || busy}
          className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] px-3 py-1.5 border transition-colors disabled:opacity-50"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--color-primary)',
            borderColor: 'var(--color-primary)'
          }}
        >
          <Camera className="w-3.5 h-3.5" strokeWidth={2} />
          {previewUrl ? 'Cambiar Foto' : 'Subir Foto'}
        </button>
        {previewUrl && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={disabled || busy}
            className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1 border transition-colors disabled:opacity-50 hover:text-[var(--color-danger)] hover:border-[var(--color-danger)]"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-muted)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <Trash2 className="w-3 h-3" strokeWidth={2} />
            Quitar
          </button>
        )}
        <p className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
          JPG · PNG · WEBP — máx 2 MB
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default AvatarUploader;
