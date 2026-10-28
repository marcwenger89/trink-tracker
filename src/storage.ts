import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrinkType } from './drinks';

export type Entry = {
  id: string;
  amount: number; // ml
  timestamp: number; // ms
  type: DrinkType;
};

export type QuickPick = {
  id: string;
  amount: number; // ml
  type: DrinkType;
};

const ENTRIES_KEY = 'trink:entries';
const GOAL_KEY = 'trink:goal';
const QUICK_KEY = 'trink:quick';
export const DEFAULT_GOAL = 2000;

export const DEFAULT_QUICK_PICKS: QuickPick[] = [
  { id: 'default-wasser-250', amount: 250, type: 'wasser' },
  { id: 'default-wasser-500', amount: 500, type: 'wasser' },
  { id: 'default-kaffee-150', amount: 150, type: 'kaffee' },
  { id: 'default-suess-330', amount: 330, type: 'suess' },
];

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function loadEntries(): Promise<Entry[]> {
  const raw = await AsyncStorage.getItem(ENTRIES_KEY);
  if (!raw) return [];
  // Entries saved before drink types existed are treated as water.
  return (JSON.parse(raw) as Entry[]).map((e) => ({ ...e, type: e.type ?? 'wasser' }));
}

export async function saveEntries(entries: Entry[]): Promise<void> {
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export async function loadGoal(): Promise<number> {
  const raw = await AsyncStorage.getItem(GOAL_KEY);
  return raw ? Number(raw) : DEFAULT_GOAL;
}

export async function saveGoal(goal: number): Promise<void> {
  await AsyncStorage.setItem(GOAL_KEY, String(goal));
}

export async function loadQuickPicks(): Promise<QuickPick[]> {
  const raw = await AsyncStorage.getItem(QUICK_KEY);
  return raw ? (JSON.parse(raw) as QuickPick[]) : DEFAULT_QUICK_PICKS;
}

export async function saveQuickPicks(picks: QuickPick[]): Promise<void> {
  await AsyncStorage.setItem(QUICK_KEY, JSON.stringify(picks));
}

/** Local calendar day key, e.g. "2026-10-28". */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function lastNDays(n: number, from = new Date()): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(from);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
}
