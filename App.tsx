import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Dino } from './src/Dino';
import { DRINK_TYPE_ORDER, DrinkType, drinkInfo } from './src/drinks';
import { dayKey, lastNDays } from './src/storage';
import { useDrinks } from './src/useDrinks';

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const colors = {
  bg: '#F2F7FB',
  card: '#FFFFFF',
  primary: '#1E88E5',
  primaryLight: '#BBDEFB',
  water: '#42A5F5',
  text: '#0D1B2A',
  muted: '#6B7C93',
  border: '#DDE5EE',
  success: '#2E7D32',
  danger: '#D32F2F',
};

// Alert.alert is a no-op on web, so fall back to the browser dialogs there.
function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
}

function confirmDestructive(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Abbrechen', style: 'cancel' },
    { text: 'Löschen', style: 'destructive', onPress: onConfirm },
  ]);
}

function haptic(success: boolean) {
  if (Platform.OS === 'web') return;
  if (success) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function formatMl(ml: number) {
  return ml >= 1000 ? `${(ml / 1000).toFixed(2).replace('.', ',')} L` : `${ml} ml`;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDayTitle(day: Date) {
  const todayKey = dayKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const k = dayKey(day);
  if (k === todayKey) return 'Heute';
  if (k === dayKey(yesterday)) return 'Gestern';
  return `${WEEKDAYS[day.getDay()]}, ${day.getDate()}.${day.getMonth() + 1}.`;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TrinkTracker />
    </SafeAreaProvider>
  );
}

function TrinkTracker() {
  const {
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
  } = useDrinks();
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [customAmount, setCustomAmount] = useState('');
  const [customType, setCustomType] = useState<DrinkType>('wasser');
  const [saveAsQuick, setSaveAsQuick] = useState(true);

  const week = useMemo(() => lastNDays(7), []);
  const selectedKey = dayKey(selectedDay);
  const totals = totalsForDay(selectedDay);
  const total = totals.hydration;
  const progress = total / goal;
  const dayEntries = entriesForDay(selectedDay);
  const reached = total >= goal;

  const handleAdd = (ml: number, type: DrinkType) => {
    const wasBelow = total < goal;
    addDrink(ml, type, selectedDay);
    haptic(drinkInfo(type).hydrates && wasBelow && total + ml >= goal);
  };

  const handleCustomAdd = () => {
    const ml = parseInt(customAmount, 10);
    if (Number.isNaN(ml) || ml <= 0 || ml > 5000) {
      showMessage('Ungültige Menge', 'Bitte eine Menge zwischen 1 und 5000 ml eingeben.');
      return;
    }
    handleAdd(ml, customType);
    if (saveAsQuick) addQuickPick(ml, customType);
    setCustomAmount('');
  };

  const handleRemoveQuick = (id: string, label: string) => {
    confirmDestructive('Aus Schnellauswahl entfernen?', label, () => removeQuickPick(id));
  };

  const handleRemoveEntry = (id: string, label: string) => {
    confirmDestructive('Eintrag löschen?', `${label} entfernen`, () => removeDrink(id));
  };

  if (!loaded) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const weekMax = Math.max(goal, ...week.map((d) => totalsForDay(d).hydration));
  const typesToday = DRINK_TYPE_ORDER.filter((t) => totals.byType[t]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>💧 Trink-Tracker</Text>
        <Text style={styles.subtitle}>{formatDayTitle(selectedDay)}</Text>

        {/* Fortschritt mit Dino */}
        <View style={styles.card}>
          <View style={styles.progressRow}>
            <Dino progress={progress} hasAlcohol={totals.alcohol > 0} />
            <View style={styles.progressInfo}>
              <Text style={styles.totalText}>{formatMl(total)}</Text>
              <Text style={styles.goalText}>von {formatMl(goal)}</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(progress, 1) * 100}%`,
                      backgroundColor: reached ? colors.success : colors.water,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.statusText, reached && { color: colors.success }]}>
                {reached
                  ? `Ziel erreicht! ${Math.round(progress * 100)}%`
                  : `${Math.round(progress * 100)}% · noch ${formatMl(goal - total)}`}
              </Text>
              <View style={styles.goalRow}>
                <Pressable
                  style={styles.goalBtn}
                  onPress={() => setGoal(Math.max(500, goal - 250))}
                >
                  <Text style={styles.goalBtnText}>−</Text>
                </Pressable>
                <Text style={styles.goalLabel}>Ziel</Text>
                <Pressable
                  style={styles.goalBtn}
                  onPress={() => setGoal(Math.min(6000, goal + 250))}
                >
                  <Text style={styles.goalBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {typesToday.length > 0 && (
            <View style={styles.breakdown}>
              {typesToday.map((t) => {
                const info = drinkInfo(t);
                return (
                  <View key={t} style={[styles.breakdownChip, { borderColor: info.color }]}>
                    <Text style={styles.breakdownText}>
                      {info.icon} {info.label} {formatMl(totals.byType[t] ?? 0)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Schnellauswahl */}
        <Text style={styles.sectionTitle}>Schnellauswahl</Text>
        <View style={styles.quickGrid}>
          {quickPicks.map((q) => {
            const info = drinkInfo(q.type);
            return (
              <Pressable
                key={q.id}
                style={({ pressed }) => [
                  styles.quickBtn,
                  { borderColor: info.color },
                  pressed && styles.pressed,
                ]}
                onPress={() => handleAdd(q.amount, q.type)}
                onLongPress={() => handleRemoveQuick(q.id, `${info.label} ${formatMl(q.amount)}`)}
              >
                <Text style={styles.quickIcon}>{info.icon}</Text>
                <Text style={styles.quickMl}>{formatMl(q.amount)}</Text>
                <Text style={styles.quickLabel} numberOfLines={1}>
                  {info.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>Lange drücken, um ein Getränk zu entfernen.</Text>

        {/* Eigenes Getränk */}
        <Text style={styles.sectionTitle}>Eigenes Getränk</Text>
        <View style={styles.card}>
          <View style={styles.typeGrid}>
            {DRINK_TYPE_ORDER.map((t) => {
              const info = drinkInfo(t);
              const active = t === customType;
              return (
                <Pressable
                  key={t}
                  onPress={() => setCustomType(t)}
                  style={[
                    styles.typeChip,
                    { borderColor: info.color },
                    active && { backgroundColor: info.color },
                  ]}
                >
                  <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                    {info.icon} {info.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {!drinkInfo(customType).hydrates && (
            <Text style={styles.hint}>Alkohol zählt nicht zu deinem Trinkziel.</Text>
          )}
          <View style={styles.customRow}>
            <TextInput
              style={styles.input}
              placeholder="Menge in ml"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              value={customAmount}
              onChangeText={(t) => setCustomAmount(t.replace(/[^0-9]/g, ''))}
              onSubmitEditing={handleCustomAdd}
              returnKeyType="done"
            />
            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
              onPress={handleCustomAdd}
            >
              <Text style={styles.addBtnText}>Hinzufügen</Text>
            </Pressable>
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Zur Schnellauswahl hinzufügen</Text>
            <Switch
              value={saveAsQuick}
              onValueChange={setSaveAsQuick}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </View>

        {/* Woche */}
        <Text style={styles.sectionTitle}>Letzte 7 Tage</Text>
        <View style={[styles.card, styles.weekCard]}>
          {week.map((d) => {
            const k = dayKey(d);
            const value = totalsForDay(d).hydration;
            const selected = k === selectedKey;
            return (
              <Pressable key={k} style={styles.weekCol} onPress={() => setSelectedDay(d)}>
                <Text style={styles.weekValue}>
                  {value ? (value / 1000).toFixed(1).replace('.', ',') : ''}
                </Text>
                <View style={styles.weekBarTrack}>
                  <View
                    style={[styles.weekGoalLine, { bottom: `${(goal / weekMax) * 100}%` }]}
                  />
                  <View
                    style={[
                      styles.weekBar,
                      {
                        height: `${(value / weekMax) * 100}%`,
                        backgroundColor: value >= goal ? colors.success : colors.water,
                        opacity: selected ? 1 : 0.55,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.weekDay, selected && styles.weekDaySelected]}>
                  {WEEKDAYS[d.getDay()]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Einträge */}
        <Text style={styles.sectionTitle}>Einträge ({dayEntries.length})</Text>
        <View style={styles.card}>
          {dayEntries.length === 0 ? (
            <Text style={styles.empty}>Noch nichts getrunken.</Text>
          ) : (
            dayEntries.map((e, i) => {
              const info = drinkInfo(e.type);
              const label = `${info.label} ${formatMl(e.amount)}`;
              return (
                <Pressable
                  key={e.id}
                  onLongPress={() => handleRemoveEntry(e.id, label)}
                  style={[styles.entryRow, i > 0 && styles.entryBorder]}
                >
                  <Text style={styles.entryTime}>{formatTime(e.timestamp)}</Text>
                  <Text style={styles.entryIcon}>{info.icon}</Text>
                  <Text style={styles.entryType}>{info.label}</Text>
                  <Text style={styles.entryAmount}>{formatMl(e.amount)}</Text>
                  <Pressable hitSlop={10} onPress={() => handleRemoveEntry(e.id, label)}>
                    <Text style={styles.entryDelete}>✕</Text>
                  </Pressable>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressInfo: { flex: 1 },
  totalText: { fontSize: 30, fontWeight: '800', color: colors.primary },
  goalText: { fontSize: 15, color: colors.muted },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryLight,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: { height: '100%', borderRadius: 5 },
  statusText: { fontSize: 14, marginTop: 6, color: colors.text, fontWeight: '600' },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  goalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalBtnText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  goalLabel: { fontSize: 14, color: colors.muted },
  breakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  breakdownChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  breakdownText: { fontSize: 12, color: colors.text },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 10,
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: {
    width: '23%',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  pressed: { opacity: 0.6, transform: [{ scale: 0.97 }] },
  quickIcon: { fontSize: 24 },
  quickMl: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 4 },
  quickLabel: { fontSize: 11, color: colors.muted },
  hint: { fontSize: 12, color: colors.muted, marginTop: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeChipText: { fontSize: 13, color: colors.text },
  typeChipTextActive: { color: '#fff', fontWeight: '700' },
  customRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  switchLabel: { fontSize: 14, color: colors.text },
  weekCard: { flexDirection: 'row', justifyContent: 'space-between', height: 180 },
  weekCol: { flex: 1, alignItems: 'center' },
  weekValue: { fontSize: 10, color: colors.muted, height: 14 },
  weekBarTrack: {
    flex: 1,
    width: 22,
    justifyContent: 'flex-end',
    marginVertical: 6,
  },
  weekBar: { width: '100%', borderRadius: 6, minHeight: 2 },
  weekGoalLine: {
    position: 'absolute',
    left: -6,
    right: -6,
    height: 1,
    backgroundColor: colors.muted,
    opacity: 0.4,
  },
  weekDay: { fontSize: 12, color: colors.muted },
  weekDaySelected: { color: colors.primary, fontWeight: '800' },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 8 },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  entryBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  entryTime: { width: 52, color: colors.muted, fontSize: 14 },
  entryIcon: { fontSize: 18, marginRight: 8 },
  entryType: { flex: 1, fontSize: 15, color: colors.text },
  entryAmount: { fontSize: 15, fontWeight: '700', color: colors.text, marginRight: 12 },
  entryDelete: { color: colors.danger, fontSize: 16, paddingHorizontal: 6 },
});
