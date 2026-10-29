/**
 * Traînée du pointeur laser : des points horodatés qui s'estompent puis disparaissent.
 * Elle ne fait pas partie des formes ni de l'historique (rien à annuler ni à gommer).
 */
import type { Point } from '@shared/types';

/** Durée de vie d'un point de la traînée (ms). */
export const LASER_LIFETIME_MS = 1000;

export interface LaserPoint extends Point {
  /** Instant d'ajout (ms, horloge `performance.now()`). */
  time: number;
}

/** Une traînée par geste : relâcher puis appuyer ailleurs ne relie pas les deux. */
export type LaserSegment = LaserPoint[];

/** Opacité d'un point selon son âge : 1 à sa création, 0 en fin de vie (fondu accéléré). */
export function laserAlpha(age: number, lifetime = LASER_LIFETIME_MS): number {
  const remaining = 1 - age / lifetime;
  return remaining <= 0 ? 0 : remaining * remaining;
}

/**
 * Nombre de points expirés en tête de segment. Les points sont ajoutés dans l'ordre
 * chronologique : les plus anciens sont toujours au début.
 */
export function expiredCount(
  segment: readonly LaserPoint[],
  now: number,
  lifetime = LASER_LIFETIME_MS,
): number {
  const firstAlive = segment.findIndex((p) => now - p.time < lifetime);
  return firstAlive === -1 ? segment.length : firstAlive;
}

export class LaserTrail {
  private segments: LaserSegment[] = [];
  private current: LaserSegment | null = null;

  /** Début d'un geste : nouveau segment. */
  start(point: LaserPoint): void {
    this.current = [point];
    this.segments.push(this.current);
  }

  add(point: LaserPoint): void {
    this.current?.push(point);
  }

  end(): void {
    this.current = null;
  }

  /** Vrai tant qu'il reste quelque chose à afficher. */
  get isAlive(): boolean {
    return this.segments.some((segment) => segment.length > 0);
  }

  /** Nombre de points encore affichés (pour les tests). */
  get pointCount(): number {
    return this.segments.reduce((total, segment) => total + segment.length, 0);
  }

  /**
   * Retire les points expirés. Le nettoyage se fait sur place : le segment du geste
   * en cours reste le même tableau (même vide si l'on garde le pointeur immobile),
   * pour que les points suivants continuent de s'y ajouter.
   */
  prune(now: number): void {
    for (const segment of this.segments) segment.splice(0, expiredCount(segment, now));
    this.segments = this.segments.filter((s) => s.length > 0 || s === this.current);
  }

  /**
   * Dessine la traînée : halo coloré puis cœur clair, chaque tronçon avec l'opacité
   * de son point le plus récent.
   */
  draw(ctx: CanvasRenderingContext2D, now: number, color: string, width: number): void {
    this.prune(now);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const segment of this.segments) {
      segment.forEach((point, i) => {
        const previous = segment[i - 1];
        const alpha = laserAlpha(now - point.time);
        ctx.beginPath();
        // Premier point : un tronçon minuscule, car Chromium ne dessine pas
        // les tronçons de longueur nulle (même avec des extrémités arrondies).
        ctx.moveTo(previous?.x ?? point.x - 0.01, previous?.y ?? point.y);
        ctx.lineTo(point.x, point.y);
        // Halo : trait coloré flouté.
        ctx.globalAlpha = alpha;
        ctx.shadowColor = color;
        ctx.shadowBlur = width * 2.5;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
        // Cœur : trait clair et fin, effet « lumière ».
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = width * 0.4;
        ctx.stroke();
      });
    }
    ctx.restore();
  }
}
