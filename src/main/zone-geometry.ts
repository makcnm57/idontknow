/**
 * Géométrie de la capture de zone (logique pure) : rectangle choisi dans l'overlay
 * (pixels CSS de l'écran) → rectangle dans l'image capturée (pixels physiques).
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** En dessous de cette taille (pixels de l'image), la zone est ignorée. */
export const MIN_ZONE_SIZE = 4;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Convertit et borne le rectangle envoyé par le renderer. La valeur vient d'un autre
 * processus : elle est validée ici. `scale` = largeur de l'image / largeur CSS de l'écran.
 * Renvoie `null` si la donnée est invalide ou la zone trop petite.
 */
export function toImageRect(
  input: unknown,
  scale: number,
  imageWidth: number,
  imageHeight: number,
): Rect | null {
  if (typeof input !== 'object' || input === null) return null;
  const { x, y, width, height } = input as Record<string, unknown>;
  const values = [x, y, width, height];
  if (!values.every((v): v is number => typeof v === 'number' && Number.isFinite(v))) return null;
  if (!Number.isFinite(scale) || scale <= 0) return null;

  const left = clamp(Math.round((x as number) * scale), 0, imageWidth);
  const top = clamp(Math.round((y as number) * scale), 0, imageHeight);
  const right = clamp(Math.round(((x as number) + (width as number)) * scale), 0, imageWidth);
  const bottom = clamp(Math.round(((y as number) + (height as number)) * scale), 0, imageHeight);

  const rect = { x: left, y: top, width: right - left, height: bottom - top };
  return rect.width >= MIN_ZONE_SIZE && rect.height >= MIN_ZONE_SIZE ? rect : null;
}
