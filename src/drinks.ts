export type DrinkType =
  | 'wasser'
  | 'tee'
  | 'kaffee'
  | 'saft'
  | 'suess'
  | 'milch'
  | 'alkohol'
  | 'sonstiges';

export type DrinkInfo = {
  label: string;
  icon: string;
  color: string;
  /** Whether this drink counts towards the daily hydration goal. */
  hydrates: boolean;
};

export const DRINK_TYPES: Record<DrinkType, DrinkInfo> = {
  wasser: { label: 'Wasser', icon: '💧', color: '#42A5F5', hydrates: true },
  tee: { label: 'Tee', icon: '🍵', color: '#66BB6A', hydrates: true },
  kaffee: { label: 'Kaffee', icon: '☕', color: '#8D6E63', hydrates: true },
  saft: { label: 'Saft', icon: '🧃', color: '#FFA726', hydrates: true },
  suess: { label: 'Süssgetränk', icon: '🥤', color: '#EC407A', hydrates: true },
  milch: { label: 'Milch', icon: '🥛', color: '#B0BEC5', hydrates: true },
  alkohol: { label: 'Alkohol', icon: '🍺', color: '#FBC02D', hydrates: false },
  sonstiges: { label: 'Sonstiges', icon: '🫗', color: '#7E57C2', hydrates: true },
};

export const DRINK_TYPE_ORDER = Object.keys(DRINK_TYPES) as DrinkType[];

export function drinkInfo(type: DrinkType | undefined): DrinkInfo {
  return DRINK_TYPES[type ?? 'wasser'] ?? DRINK_TYPES.wasser;
}
