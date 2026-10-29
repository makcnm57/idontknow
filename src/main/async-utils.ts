/**
 * Petits utilitaires asynchrones du processus main (logique pure).
 */

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Rejette si `promise` ne s'est pas terminée après `ms` millisecondes.
 *
 * Utile pour les écritures disque : sous Windows, l'accès contrôlé aux dossiers de
 * Defender peut bloquer une écriture sans jamais renvoyer d'erreur à Electron.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${what} : pas de réponse après ${ms} ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}
