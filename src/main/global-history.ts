/**
 * Historique global multi-écrans (logique pure, sans Electron).
 *
 * Chaque overlay garde ses propres instantanés de formes ; ce registre retient seulement
 * dans quel ordre et sur quel(s) overlay(s) les étapes ont eu lieu. Annuler rejoue donc
 * la dernière action, quel que soit l'écran. Une action peut toucher plusieurs overlays
 * (« Tout effacer ») : elle forme un groupe, annulé ou rétabli d'un seul coup.
 */
export interface HistoryEntry {
  /** Identifiants des overlays concernés. */
  sources: number[];
  /** Identifiant de groupe pour une action sur plusieurs écrans. */
  groupId?: string;
}

const MAX_ENTRIES = 1000;

export class GlobalHistory {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Un overlay signale une nouvelle étape (rattachée au groupe en cours si `groupId`). */
  recordCommit(source: number, groupId?: string): void {
    const top = this.undoStack.at(-1);
    if (groupId !== undefined && top?.groupId === groupId) {
      if (!top.sources.includes(source)) top.sources.push(source);
    } else {
      this.undoStack.push({ sources: [source], groupId });
      if (this.undoStack.length > MAX_ENTRIES) this.undoStack.shift();
    }
    this.redoStack = [];
  }

  /** Overlays sur lesquels annuler, ou `undefined` s'il n'y a rien à annuler. */
  takeUndo(): number[] | undefined {
    const entry = this.undoStack.pop();
    if (!entry) return undefined;
    this.redoStack.push(entry);
    return entry.sources;
  }

  /** Overlays sur lesquels rétablir, ou `undefined` s'il n'y a rien à rétablir. */
  takeRedo(): number[] | undefined {
    const entry = this.redoStack.pop();
    if (!entry) return undefined;
    this.undoStack.push(entry);
    return entry.sources;
  }

  /** Oublie un overlay disparu (écran débranché). */
  removeSource(source: number): void {
    const prune = (stack: HistoryEntry[]): HistoryEntry[] =>
      stack
        .map((entry) => ({ ...entry, sources: entry.sources.filter((id) => id !== source) }))
        .filter((entry) => entry.sources.length > 0);
    this.undoStack = prune(this.undoStack);
    this.redoStack = prune(this.redoStack);
  }
}
