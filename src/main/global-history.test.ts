import { describe, expect, it } from 'vitest';
import { GlobalHistory } from './global-history';

describe('GlobalHistory', () => {
  it('annule dans l’ordre inverse, quel que soit l’écran', () => {
    const history = new GlobalHistory();
    history.recordCommit(1);
    history.recordCommit(2);
    history.recordCommit(1);

    expect(history.takeUndo()).toEqual([1]);
    expect(history.takeUndo()).toEqual([2]);
    expect(history.takeUndo()).toEqual([1]);
    expect(history.takeUndo()).toBeUndefined();
  });

  it('rétablit ce qui vient d’être annulé', () => {
    const history = new GlobalHistory();
    history.recordCommit(1);
    history.recordCommit(2);
    history.takeUndo();
    history.takeUndo();

    expect(history.takeRedo()).toEqual([1]);
    expect(history.takeRedo()).toEqual([2]);
    expect(history.canRedo).toBe(false);
  });

  it('vide les étapes « rétablir » après une nouvelle action', () => {
    const history = new GlobalHistory();
    history.recordCommit(1);
    history.takeUndo();
    history.recordCommit(2);
    expect(history.canRedo).toBe(false);
  });

  it('regroupe une action multi-écrans (Tout effacer)', () => {
    const history = new GlobalHistory();
    history.recordCommit(1);
    history.recordCommit(1, 'clear-1');
    history.recordCommit(2, 'clear-1');

    expect(history.takeUndo()).toEqual([1, 2]);
    expect(history.takeUndo()).toEqual([1]);
  });

  it('ne fusionne pas deux groupes différents', () => {
    const history = new GlobalHistory();
    history.recordCommit(1, 'clear-1');
    history.recordCommit(2, 'clear-2');
    expect(history.takeUndo()).toEqual([2]);
  });

  it('oublie un écran débranché', () => {
    const history = new GlobalHistory();
    history.recordCommit(1);
    history.recordCommit(2);
    history.recordCommit(1, 'g');
    history.recordCommit(2, 'g');
    history.removeSource(2);

    expect(history.takeUndo()).toEqual([1]);
    expect(history.takeUndo()).toEqual([1]);
    expect(history.canUndo).toBe(false);
  });
});
