import * as FileSystem from 'expo-file-system/legacy';
import { ImageFile } from '../types/staffHomework.type';

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpe: 'image/jpeg',
  jfif: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  dib: 'image/bmp',
  heic: 'image/heic',
  heif: 'image/heif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  dng: 'image/x-adobe-dng',
  raw: 'image/x-raw',
};

export const guessHomeworkMime = (nameOrUri?: string, mime?: string) => {
  const hinted = String(mime || '').toLowerCase().split(';')[0].trim();
  if (hinted.startsWith('image/') || hinted === 'application/pdf') return hinted;
  const ext = String(nameOrUri || '')
    .split('?')[0]
    .split('#')[0]
    .split('.')
    .pop()
    ?.toLowerCase();
  return (ext && MIME_BY_EXT[ext]) || hinted || 'application/octet-stream';
};

const fileExtension = (name: string, mime: string) => {
  const fromName = /\.([a-z0-9]+)$/i.exec(name)?.[1];
  if (fromName) return fromName.toLowerCase();
  const hinted = String(mime || '').toLowerCase();
  if (hinted.includes('pdf')) return 'pdf';
  if (hinted.includes('png')) return 'png';
  if (hinted.includes('gif')) return 'gif';
  if (hinted.includes('webp')) return 'webp';
  if (hinted.includes('heic')) return 'heic';
  if (hinted.includes('heif')) return 'heif';
  if (hinted.includes('bmp') || hinted.includes('dib')) return 'bmp';
  if (hinted.includes('avif')) return 'avif';
  if (hinted.includes('svg')) return 'svg';
  if (hinted.includes('tiff') || hinted.includes('tif')) return 'tiff';
  if (hinted.includes('jpeg') || hinted.includes('jpg')) return 'jpg';
  if (hinted.includes('ico')) return 'ico';
  return 'bin';
};

const safeName = (raw: string, mime: string) => {
  const base = (raw || `homework-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_');
  const ext = fileExtension(base, mime);
  return /\.[a-z0-9]+$/i.test(base) ? base : `${base}.${ext}`;
};

export const isAllowedHomeworkFile = (name?: string, mime?: string) => {
  const type = guessHomeworkMime(name, mime);
  if (type.startsWith('image/') || type === 'application/pdf' || type === 'application/octet-stream') {
    return true;
  }
  return /\.(jpe?g|png|gif|webp|bmp|dib|heic|heif|tiff?|avif|svg|ico|dng|raw|pdf)$/i.test(
    String(name || '')
  );
};

const stripDataUrl = (value: string) =>
  value.replace(/^data:[^;]+;base64,/i, '').replace(/\s+/g, '');

export const fileToBase64 = async (uri: string): Promise<string | null> => {
  const cleaned = String(uri || '').trim();
  if (!cleaned) return null;

  try {
    const encoded = await FileSystem.readAsStringAsync(cleaned, { encoding: 'base64' });
    if (encoded) return stripDataUrl(encoded);
  } catch {
    return null;
  }

  return null;
};

/** Read bytes only. Never pass the file URI to FormData — Android/Hermes crashes on EXIF dates. */
export const materializeHomeworkFile = async (file: ImageFile): Promise<ImageFile | null> => {
  const uri = String(file.uri || '');
  if (!uri && !file.base64) return null;

  const type = guessHomeworkMime(file.name || uri, file.type);
  const name = safeName(file.name || `homework-${Date.now()}`, type);
  const existing = file.base64 ? stripDataUrl(file.base64) : '';
  const base64 = existing || (uri ? await fileToBase64(uri) : null);

  if (!base64) return null;

  return {
    uri: uri || `data:${type};base64,${base64.slice(0, 12)}`,
    name,
    type,
    size: file.size || Math.floor((base64.length * 3) / 4),
    base64,
  };
};

export const materializeHomeworkImage = materializeHomeworkFile;

export const isHermesDateError = (error: any) =>
  /formatDatepart|unimplemented|unsupported format|unsupported FormData part/i.test(
    String(error?.message || error || '')
  );

export const isPdfFile = (file?: { name?: string; type?: string }) =>
  /pdf/i.test(`${file?.type || ''} ${file?.name || ''}`);
