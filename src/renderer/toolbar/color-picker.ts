/**
 * Sélecteur de couleur personnalisé (sélecteur intégré de Chromium).
 *
 * La barre d'outils n'est pas activable (pour ne voler le focus à personne), or Chromium
 * n'ouvre le sélecteur que depuis une fenêtre active. On la rend donc activable le temps
 * du choix, puis on rend le focus dès que le sélecteur se ferme.
 *
 * Le sélecteur est une bulle qui ne prend pas le focus : sa fermeture (validation, clic
 * à l'extérieur, Échap) se détecte avec la pseudo-classe `:open` du champ.
 */
const POLL_MS = 150;

export function attachColorPicker(
  swatch: HTMLElement,
  input: HTMLInputElement,
  onColor: (color: string) => void,
): void {
  let pollTimer: number | undefined;

  const release = (): void => {
    window.clearInterval(pollTimer);
    pollTimer = undefined;
    window.screendraw.releaseToolbarFocus();
  };

  swatch.addEventListener('click', (e) => {
    // On ouvre nous-mêmes le sélecteur, une fois la fenêtre activable.
    e.preventDefault();
    if (pollTimer !== undefined) return;
    void window.screendraw.requestToolbarFocus().then(() => {
      try {
        input.showPicker();
      } catch {
        // Ouverture refusée (activation utilisateur expirée) : on rend le focus.
        release();
        return;
      }
      pollTimer = window.setInterval(() => {
        if (!input.matches(':open')) release();
      }, POLL_MS);
    });
  });

  input.addEventListener('input', () => onColor(input.value));
}
