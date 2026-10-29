# ScreenDraw — Annotation d'écran multi-outils

> Fichier de contexte pour Claude Code. À lire en entier avant toute modification du projet.

## 1. Objectif du projet

Application de bureau (Windows en priorité, macOS/Linux en bonus) qui affiche une **couche transparente par-dessus tout l'écran** pour dessiner, annoter, surligner et présenter, sans toucher aux fenêtres en dessous.

Cas d'usage :
- Expliquer quelque chose pendant un partage d'écran (Discord, Teams, OBS, cours).
- Annoter une capture rapidement puis l'enregistrer ou la copier.
- Faire une présentation avec pointeur laser, projecteur et loupe.

Ce projet fait partie d'un **portfolio** : le code doit être propre, lisible et bien documenté, et le README doit donner envie (GIF de démo, capture, liste des fonctionnalités).

## 2. Stack technique

| Élément | Choix | Raison |
|---|---|---|
| Runtime bureau | **Electron** (dernière version stable) | Fenêtre transparente, toujours au premier plan, raccourcis globaux |
| Outillage | **electron-vite** + **TypeScript** (strict) | Build rapide, hot reload |
| Rendu du dessin | **Canvas 2D** natif, sans framework | Performance sur un écran entier |
| Tracé à main levée | **perfect-freehand** | Traits lisses, sensibles à la pression (tablette graphique) |
| UI barre d'outils | HTML/CSS + TypeScript (pas de React sauf si vraiment nécessaire) | Léger |
| Packaging | **electron-builder** (installeur NSIS Windows + version portable) | |
| Qualité | ESLint + Prettier, Vitest pour la logique pure | |

Ne pas ajouter de dépendance lourde sans la justifier dans la PR/le commit.

## 3. Architecture

```
src/
├── main/                 # Processus principal Electron
│   ├── index.ts          # Démarrage, cycle de vie de l'app
│   ├── overlay.ts        # Création des fenêtres overlay (une par écran)
│   ├── toolbar.ts        # Fenêtre de la barre d'outils
│   ├── shortcuts.ts      # Raccourcis globaux (globalShortcut)
│   ├── tray.ts           # Icône dans la zone de notification
│   ├── capture.ts        # Captures d'écran (desktopCapturer)
│   └── settings.ts       # Persistance des préférences (JSON dans userData)
├── preload/
│   └── index.ts          # API exposée via contextBridge (aucun accès Node direct au renderer)
├── renderer/
│   ├── overlay/          # Canvas de dessin
│   │   ├── canvas.ts     # Gestion des calques, devicePixelRatio, redessin
│   │   ├── history.ts    # Undo / redo
│   │   ├── shapes/       # Un fichier par type d'élément (stroke, rect, ellipse, arrow, text…)
│   │   └── tools/        # Un fichier par outil (logique pointerdown/move/up)
│   └── toolbar/          # Interface de la barre d'outils
└── shared/
    ├── types.ts          # Types partagés (Tool, Shape, Settings, messages IPC)
    └── ipc-channels.ts   # Noms des canaux IPC centralisés
```

### Règles d'architecture

- **Sécurité Electron** : `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. Tout passe par le preload et `contextBridge`.
- **Modèle vectoriel** : chaque élément dessiné est un objet (`Shape`) stocké dans une liste. Le canvas est redessiné à partir de cette liste. Cela rend possible l'undo/redo, la sélection, le déplacement et l'export.
- **Deux calques canvas** : un calque « figé » (éléments terminés) et un calque « actif » (élément en cours de tracé), pour ne pas tout redessiner à chaque mouvement de souris.
- **Pattern outil** : chaque outil implémente la même interface :
  ```ts
  interface Tool {
    id: ToolId;
    cursor: string;
    onPointerDown(e: PointerEvent, ctx: ToolContext): void;
    onPointerMove(e: PointerEvent, ctx: ToolContext): void;
    onPointerUp(e: PointerEvent, ctx: ToolContext): void;
    onKeyDown?(e: KeyboardEvent, ctx: ToolContext): void;
  }
  ```
  Ajouter un outil = créer un fichier dans `tools/` et l'enregistrer dans le registre. Aucun `switch` géant.
- **Multi-écrans** : une fenêtre overlay par écran (`screen.getAllDisplays()`), recréées sur les événements `display-added` / `display-removed` / `display-metrics-changed`.
- **HiDPI** : le canvas est dimensionné en `largeur × devicePixelRatio` et mis à l'échelle avec `ctx.scale()`.
- **Pointer Events** uniquement (pas de mouse events), pour gérer souris, tactile et stylet avec `e.pressure`.

## 4. Fenêtre overlay (points critiques)

```ts
new BrowserWindow({
  x, y, width, height,          // limites exactes de l'écran
  transparent: true,
  frame: false,
  resizable: false,
  movable: false,
  skipTaskbar: true,
  hasShadow: false,
  focusable: true,
  alwaysOnTop: true,
  webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: true },
});
win.setAlwaysOnTop(true, 'screen-saver');
win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
```

Deux modes :
- **Mode dessin** : l'overlay capte la souris.
- **Mode passif** (click-through) : `win.setIgnoreMouseEvents(true, { forward: true })`. Les annotations restent visibles mais on peut cliquer sur les fenêtres en dessous.

La barre d'outils est une **fenêtre séparée**, petite, déplaçable, toujours au-dessus de l'overlay, et elle reste cliquable en mode passif.

## 5. Fonctionnalités

### V1 — MVP (à faire en premier)
- [x] Overlay transparent plein écran, activable/désactivable par raccourci global
- [x] Mode dessin / mode passif (click-through)
- [x] **Stylo** (perfect-freehand, sensible à la pression)
- [x] **Surligneur** (semi-transparent, trait large, mode de fusion `multiply`)
- [x] **Gomme** (supprime l'élément touché, pas les pixels)
- [x] Palette de couleurs (8 couleurs prédéfinies + sélecteur personnalisé)
- [x] Épaisseur du trait (3 tailles + molette pour ajuster)
- [x] Undo / redo (Ctrl+Z / Ctrl+Y)
- [x] Tout effacer
- [x] Barre d'outils déplaçable
- [x] Icône dans la zone de notification avec menu (Afficher, Paramètres, Quitter)

### V2 — Formes et texte
- [x] **Ligne**, **flèche**, **rectangle**, **ellipse** (Shift = contraindre : ligne droite à 45°, carré, cercle)
- [x] Formes pleines ou contour uniquement
- [x] **Texte** (clic pour placer, édition en ligne, taille de police réglable)
- [x] **Outil sélection** : sélectionner, déplacer, supprimer un élément
- [x] **Numérotation** : pastilles 1, 2, 3… pour annoter des étapes

### V3 — Présentation
- [x] **Pointeur laser** : trait lumineux qui s'efface après ~1 s
- [x] **Projecteur** (spotlight) : assombrit l'écran sauf un cercle autour du curseur
- [x] **Loupe** : zoom autour du curseur (capture via desktopCapturer)
  - *Choix : capture figée à l'activation (une capture en direct filmerait la loupe elle-même, et exclure l'overlay des captures le masquerait aussi dans Discord/Teams/OBS).*
- [x] **Tableau blanc / noir** : fond opaque pour dessiner sans l'écran derrière
- [ ] **Mise en évidence des clics** : cercle animé à chaque clic (utile en tutoriel vidéo)
  - *Reportée (décision du 29/10/2026) : les clics en mode passif traversent l'overlay, il faudrait un hook souris natif (`uiohook-napi`).*

### V4 — Export et confort
- [x] **Capture** : écran + annotations → PNG enregistré et/ou copié dans le presse-papiers
  - *Images\ScreenDraw, avec repli sur Téléchargements\ScreenDraw si l'accès contrôlé aux dossiers de Windows Defender bloque Images (cas de la machine de dev).*
- [ ] Capture d'une zone sélectionnée
- [ ] Paramètres persistants (couleur, épaisseur, outil, raccourcis, position de la barre)
- [ ] Raccourcis personnalisables
- [ ] Lancement au démarrage de Windows (optionnel)
- [ ] Thème clair / sombre de la barre d'outils

## 6. Raccourcis par défaut

| Action | Raccourci |
|---|---|
| Afficher / masquer l'overlay | `Ctrl + Shift + D` (global) |
| Basculer mode dessin / passif | `Ctrl + Shift + F` (global) |
| Stylo | `P` |
| Surligneur | `H` |
| Gomme | `E` |
| Ligne / Flèche | `L` / `A` |
| Rectangle / Ellipse | `R` / `O` |
| Texte | `T` |
| Sélection | `V` |
| Numérotation | `N` |
| Laser | `K` |
| Projecteur | `S` |
| Loupe | `Z` |
| Tableau blanc / noir | `W` / `B` |
| Couleurs 1 à 8 | `1` … `8` |
| Undo / Redo | `Ctrl + Z` / `Ctrl + Y` |
| Tout effacer | `Suppr` |
| Capture | `Ctrl + Shift + S` (global) |
| Quitter le mode dessin | `Échap` |

Les raccourcis à une lettre ne fonctionnent que quand l'overlay a le focus, jamais en global.

## 7. Conventions de code

- TypeScript strict, aucun `any` sauf justification en commentaire.
- Noms de variables et de fonctions en **anglais**, commentaires et docs en **français**.
- Une responsabilité par fichier ; viser moins de 200 lignes par fichier.
- Les canaux IPC sont typés et déclarés uniquement dans `shared/ipc-channels.ts`.
- La logique pure (géométrie, historique, hit-test de la gomme, sérialisation) est testée avec Vitest.
- Commits au format **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `docs:`…).

## 8. Commandes

```bash
npm install          # installer les dépendances
npm run dev          # lancer en développement (hot reload)
npm run lint         # ESLint
npm run test         # Vitest
npm run build        # build de production
npm run dist         # installeur Windows (electron-builder)
```

## 9. Performance

- Le tracé doit rester fluide à 60 fps sur un écran 1440p ou 4K.
- Utiliser `requestAnimationFrame` pour le redessin, jamais de redessin direct dans `pointermove`.
- Utiliser `getCoalescedEvents()` pour ne perdre aucun point avec un stylet rapide.
- Ne redessiner le calque figé que lorsque la liste des éléments change.

## 10. Définition de « terminé » pour chaque fonctionnalité

1. Fonctionne sur un écran simple **et** en double écran.
2. Fonctionne à 100 % et 150 % de mise à l'échelle Windows.
3. Compatible undo/redo.
4. `npm run lint` et `npm run test` passent.
5. Case cochée dans ce fichier (section 5).

## 11. Portfolio

À livrer en fin de projet :
- `README.md` avec : description courte, **GIF de démo** en haut, liste des fonctionnalités, raccourcis, instructions d'installation, stack et choix techniques expliqués.
- Dossier `docs/` avec captures d'écran et un court schéma de l'architecture (main / preload / renderer).
- Release GitHub avec l'installeur `.exe`.
- Une section « Ce que j'ai appris » dans le README (IPC Electron, sécurité, rendu canvas, multi-écrans).

## 12. Méthode de travail pour Claude Code

- Travailler **phase par phase** (V1 → V2 → V3 → V4). Ne pas commencer une phase avant que la précédente fonctionne.
- Avant une grosse modification, proposer un plan court et attendre validation.
- Après chaque fonctionnalité, expliquer brièvement ce qui a été fait et comment le tester à la main.
- En cas de doute sur un comportement Electron spécifique à Windows (transparence, focus, click-through), le signaler plutôt que deviner.
