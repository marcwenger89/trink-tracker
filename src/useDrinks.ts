import { useCallback, useEffect, useMemo, useState } from 'react';
import { DrinkType, drinkInfo } from './drinks';
import {
  DEFAULT_GOAL,
  DEFAULT_QUICK_PICKS,
  Entry,
  QuickPick,
  dayKey,
  loadEntries,
  loadGoal,
  loadQuickPicks,
  newId,
  saveEntries,
  saveGoal,
  saveQuickPicks,
} from './storage';

export type DayTotals = {
  /** Everything that counts towards the goal (all drinks except alcohol). */
  hydration: number;
  alcohol: number;
  byType: Partial<Record<DrinkType, number>>;
};

const EMPTY_TOTALS: DayTotals = { hydration: 0, alcohol: 0, byType: {} };

export function useDrinks() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [goal, setGoalState] = useState(DEFAULT_GOAL);
  const [quickPicks, setQuickPicks] = useState<QuickPick[]>(DEFAULT_QUICK_PICKS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadEntries(), loadGoal(), loadQuickPicks()]).then(([e, g, q]) => {
      setEntries(e);
      setGoalState(g);
      setQuickPicks(q);
      setLoaded(true);
    });
  }, []);

  const updateEntries = useCallback((next: Entry[]) => {
    setEntries(next);
    saveEntries(next);
  }, []);

  const updateQuickPicks = useCallback((next: QuickPick[]) => {
    setQuickPicks(next);
    saveQuickPicks(next);
  }, []);

  /** Adds a drink to the given day, using the current time of day. */
  const addDrink = useCallback(
    (amount: number, type: DrinkType, day: Date) => {
      const now = new Date();
      const ts = new Date(day);
      ts.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
      updateEntries([...entries, { id: newId(), amount, type, timestamp: ts.getTime() }]);
    },
    [entries, updateEntries],
  );

  const removeDrink = useCallback(
    (id: string) => updateEntries(entries.filter((e) => e.id !== id)),
    [entries, updateEntries],
  );

  /** Adds a quick pick unless one with the same type and amount already exists. */
  const addQuickPick = useCallback(
    (amount: number, type: DrinkType) => {
      if (quickPicks.some((q) => q.amount === amount && q.type === type)) return;
      updateQuickPicks([...quickPicks, { id: newId(), amount, type }]);
    },
    [quickPicks, updateQuickPicks],
  );

  const removeQuickPick = useCallback(
    (id: string) => updateQuickPicks(quickPicks.filter((q) => q.id !== id)),
    [quickPicks, updateQuickPicks],
  );

  const setGoal = useCallback((g: number) => {
    setGoalState(g);
    saveGoal(g);
  }, []);

  const totalsByDay = useMemo(() => {
    const map: Record<string, DayTotals> = {};
    for (const e of entries) {
      const k = dayKey(new Date(e.timestamp));
      const t = (map[k] ??= { hydration: 0, alcohol: 0, byType: {} });
      t.byType[e.type] = (t.byType[e.type] ?? 0) + e.amount;
      if (drinkInfo(e.type).hydrates) t.hydration += e.amount;
      else t.alcohol += e.amount;
    }
    return map;
  }, [entries]);

  const totalsForDay = useCallback(
    (day: Date) => totalsByDay[dayKey(day)] ?? EMPTY_TOTALS,
    [totalsByDay],
  );

  const entriesForDay = useCallback(
    (day: Date) => {
      const k = dayKey(day);
      return entries
        .filter((e) => dayKey(new Date(e.timestamp)) === k)
        .reverse() // newest-added first on equal timestamps (sort is stable)
        .sort((a, b) => b.timestamp - a.timestamp);
    },
    [entries],
  );

  return {
    loaded,
    goal,
    setGoal,
    addDrink,
    removeDrink,
    quickPicks,
    addQuickPick,
    removeQuickPick,
    totalsForDay,
    entriesForDay,
  };
}
