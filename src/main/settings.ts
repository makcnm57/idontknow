/**
 * Persistance des préférences : `settings.json` dans le dossier de données de l'app
 * (AppData\Roaming, non concerné par l'accès contrôlé aux dossiers de Windows).
 *
 * Les écritures sont regroupées (une seule après une rafale de changements) et atomiques
 * (fichier temporaire puis renommage) : le fichier n'est jamais à moitié écrit.
 */
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';
import { DEFAULT_SETTINGS, parseSettings, type Settings } from './settings-schema';

const SAVE_DELAY_MS = 500;

let current: Settings = DEFAULT_SETTINGS;
let saveTimer: NodeJS.Timeout | undefined;

const settingsPath = (): string => join(app.getPath('userData'), 'settings.json');

/** Lit les paramètres au démarrage ; fichier absent ou illisible → valeurs par défaut. */
export function loadSettings(): Settings {
  try {
    current = parseSettings(JSON.parse(readFileSync(settingsPath(), 'utf8')) as unknown);
  } catch (error) {
    // Premier lancement (fichier absent) : rien à signaler.
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('[paramètres] fichier illisible, valeurs par défaut :', error);
    }
    current = DEFAULT_SETTINGS;
  }
  return current;
}

export function getSettings(): Settings {
  return current;
}

/** Modifie les paramètres et programme leur enregistrement. */
export function updateSettings(patch: Partial<Omit<Settings, 'version'>>): void {
  current = { ...current, ...patch };
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSettings, SAVE_DELAY_MS);
}

/** Enregistre immédiatement (appelé aussi à la fermeture de l'app). */
export function flushSettings(): void {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  const file = settingsPath();
  try {
    writeFileSync(`${file}.tmp`, JSON.stringify(current, null, 2), 'utf8');
    renameSync(`${file}.tmp`, file);
  } catch (error) {
    console.error('[paramètres] enregistrement impossible :', error);
  }
}
