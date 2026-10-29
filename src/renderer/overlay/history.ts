/**
 * Historique undo / redo par instantanés immuables.
 *
 * Chaque modification remplace l'état courant par une nouvelle valeur (ex. un nouveau
 * tableau de formes). Les formes elles-mêmes sont partagées entre instantanés : une étape
 * ne coûte qu'un tableau de références. Ajout, gomme et « tout effacer » sont ainsi
 * annulables de la même façon, sans logique d'inversion par commande.
 */
export class History<T> {
  private past: T[] = [];
  private future: T[] = [];

  constructor(
    private current: T,
    private readonly limit = 200,
  ) {}

  get present(): T {
    return this.current;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  /** Enregistre un nouvel état. Une nouvelle action efface les étapes « refaire ». */
  commit(next: T): void {
    if (next === this.current) return;
    this.past.push(this.current);
    if (this.past.length > this.limit) this.past.shift();
    this.current = next;
    this.future = [];
  }

  /**
   * Remplace l'état courant sans créer de nouvelle étape. Sert aux gestes continus
   * (un passage de gomme) : le premier changement fait `commit`, les suivants `amend`,
   * et un seul Ctrl+Z annule tout le geste.
   */
  amend(next: T): void {
    if (this.past.length === 0) {
      this.commit(next);
      return;
    }
    this.current = next;
    this.future = [];
  }

  /** Revient à l'état précédent. Renvoie faux s'il n'y a rien à annuler. */
  undo(): boolean {
    const previous = this.past.pop();
    if (previous === undefined) return false;
    this.future.push(this.current);
    this.current = previous;
    return true;
  }

  /** Rejoue l'état annulé. Renvoie faux s'il n'y a rien à refaire. */
  redo(): boolean {
    const next = this.future.pop();
    if (next === undefined) return false;
    this.past.push(this.current);
    this.current = next;
    return true;
  }
}
