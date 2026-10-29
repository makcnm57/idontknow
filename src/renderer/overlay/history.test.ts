import { describe, expect, it } from 'vitest';
import { History } from './history';

describe('History', () => {
  it('annule et rejoue les étapes dans l’ordre', () => {
    const history = new History<number[]>([]);
    history.commit([1]);
    history.commit([1, 2]);

    expect(history.undo()).toBe(true);
    expect(history.present).toEqual([1]);
    expect(history.undo()).toBe(true);
    expect(history.present).toEqual([]);
    expect(history.undo()).toBe(false);

    expect(history.redo()).toBe(true);
    expect(history.redo()).toBe(true);
    expect(history.present).toEqual([1, 2]);
    expect(history.redo()).toBe(false);
  });

  it('efface les étapes « refaire » après une nouvelle action', () => {
    const history = new History<string>('a');
    history.commit('b');
    history.undo();
    history.commit('c');

    expect(history.canRedo).toBe(false);
    expect(history.present).toBe('c');
    history.undo();
    expect(history.present).toBe('a');
  });

  it('ignore un commit identique à l’état courant', () => {
    const shapes: number[] = [];
    const history = new History(shapes);
    history.commit(shapes);
    expect(history.canUndo).toBe(false);
  });

  it('regroupe un geste continu en une seule étape avec amend', () => {
    const history = new History<number[]>([1, 2, 3]);
    history.commit([2, 3]);
    history.amend([3]);
    history.amend([]);

    expect(history.present).toEqual([]);
    history.undo();
    expect(history.present).toEqual([1, 2, 3]);
  });

  it('amend sur un historique vide crée la première étape', () => {
    const history = new History<number[]>([1]);
    history.amend([]);
    expect(history.canUndo).toBe(true);
  });

  it('borne le nombre d’étapes conservées', () => {
    const history = new History(0, 3);
    for (let i = 1; i <= 10; i++) history.commit(i);

    let undos = 0;
    while (history.undo()) undos++;
    expect(undos).toBe(3);
    expect(history.present).toBe(7);
  });
});
