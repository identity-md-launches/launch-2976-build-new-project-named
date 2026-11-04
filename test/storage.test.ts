import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addRun, loadSave, persistSave } from '../src/lib/storage';

test('missing, corrupt, or blocked storage falls back to a playable blank save', () => {
  for (const raw of [
    null,
    '{bad',
    'null',
    '{"version":2}',
    '{"version":1,"best":-1,"runs":"bad"}',
  ]) {
    const save = loadSave({ getItem: () => raw });
    assert.equal(save.best, 0);
    assert.deepEqual(save.runs, []);
    assert.equal(save.sound, false);
  }
  assert.equal(
    loadSave({
      getItem() {
        throw new Error('blocked');
      },
    }).best,
    0,
  );
  assert.equal(
    persistSave(loadSave(null), {
      setItem() {
        throw new Error('quota');
      },
    }),
    false,
  );
});

test('completed runs are ranked, limited to ten, and round-trip without losing the best', () => {
  let save = loadSave(null);
  for (const score of [10, 40, 20, 90, 80, 70, 60, 30, 50, 100, 120, 110]) {
    save = addRun(save, { score, cheese: 1, seconds: 2, distance: 300 }, null);
  }
  assert.equal(save.runs.length, 10);
  assert.equal(save.best, 120);
  assert.deepEqual(
    save.runs.slice(0, 3).map((r) => r.score),
    [120, 110, 100],
  );
  let serialized = '';
  assert.equal(
    persistSave(save, {
      setItem: (_key, value) => {
        serialized = value;
      },
    }),
    true,
  );
  assert.deepEqual(loadSave({ getItem: () => serialized }), save);
});

test('malformed score rows cannot corrupt the local leaderboard', () => {
  const save = loadSave({
    getItem: () =>
      JSON.stringify({
        version: 1,
        best: 'not a number',
        runs: [
          null,
          { score: -20 },
          {
            id: 'bad',
            at: 'invalid date',
            score: 3,
            cheese: 0,
            seconds: 1,
            distance: 10,
            address: null,
          },
        ],
      }),
  });
  assert.equal(save.best, 0);
  assert.deepEqual(save.runs, []);
});

test('a lower new run never erases the personal best or the sound preference', () => {
  let save = { ...loadSave(null), sound: true };
  save = addRun(
    save,
    { score: 200, cheese: 2, seconds: 10, distance: 1000 },
    null,
  );
  save = addRun(
    save,
    { score: 15, cheese: 0, seconds: 1, distance: 180 },
    null,
  );
  assert.equal(save.best, 200);
  assert.equal(save.sound, true);
  assert.equal(save.runs.length, 2);
});
