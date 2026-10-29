/**
 * Nommage des fichiers de capture (logique pure).
 */

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * Nom de fichier horodaté, triable et sans caractère interdit sous Windows :
 * `ScreenDraw_2026-10-29_21-55-03.png`.
 */
export function captureFileName(date: Date): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  return `ScreenDraw_${day}_${time}.png`;
}
