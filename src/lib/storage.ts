import type { RunResult } from '../game/engine';

export interface LocalRun extends RunResult {
  id: string;
  at: string;
  address: string | null;
}
export interface SaveData {
  version: 1;
  best: number;
  runs: LocalRun[];
  sound: boolean;
}
const KEY = 'squeek-runner:v1';
const EMPTY: SaveData = { version: 1, best: 0, runs: [], sound: false };
const finite = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0;

export function loadSave(
  storage: Pick<Storage, 'getItem'> | null = safeStorage(),
): SaveData {
  try {
    const raw: unknown = JSON.parse(storage?.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object') return { ...EMPTY, runs: [] };
    const data = raw as Partial<SaveData>;
    if (data.version !== 1) return { ...EMPTY, runs: [] };
    const runs = Array.isArray(data.runs)
      ? data.runs
          .filter(
            (r): r is LocalRun =>
              !!r &&
              typeof r === 'object' &&
              typeof r.id === 'string' &&
              r.id.length < 100 &&
              typeof r.at === 'string' &&
              !Number.isNaN(Date.parse(r.at)) &&
              finite(r.score) &&
              finite(r.cheese) &&
              finite(r.seconds) &&
              finite(r.distance) &&
              (r.address === null || /^0x[\da-fA-F]{40}$/.test(r.address)),
          )
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
      : [];
    return {
      version: 1,
      best: Math.max(
        finite(data.best) ? data.best : 0,
        ...runs.map((r) => r.score),
      ),
      runs,
      sound: data.sound === true,
    };
  } catch {
    return { ...EMPTY, runs: [] };
  }
}

export function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function persistSave(
  data: SaveData,
  storage: Pick<Storage, 'setItem'> | null = safeStorage(),
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function addRun(
  data: SaveData,
  result: RunResult,
  address: string | null,
): SaveData {
  const run: LocalRun = {
    ...result,
    score: Math.floor(result.score),
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    address,
  };
  return {
    ...data,
    best: Math.max(data.best, run.score),
    runs: [...data.runs, run].sort((a, b) => b.score - a.score).slice(0, 10),
  };
}

export const formatScore = (n: number) => Math.floor(n).toLocaleString('en-US');
export const shortAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;
