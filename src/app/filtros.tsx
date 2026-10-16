import { router } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, Field, gutter, Segmented, Txt } from '@/components/primitives';
import { useData } from '@/data/DataProvider';
import { CITIES, UF_NAMES } from '@/data/mock';
import { MODULES } from '@/data/modules';
import { applyFilters, DEFAULT_FILTERS } from '@/data/selectors';
import { useNow } from '@/data/useNow';
import type { Filters, OsFamily, Plan, PeriodFilter, StatusFilter } from '@/data/types';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

const STATUS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativos', label: 'Ativos' },
  { value: 'suspeitos', label: 'Suspeitos' },
  { value: 'encerrados', label: 'Encerrados' },
];

const DEVICES: OsFamily[] = ['Android', 'iOS', 'Windows', 'macOS', 'Linux'];

const PERIODS: { value: PeriodFilter; label: string }[] = [
  { value: 'agora', label: 'Agora' },
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: 'outro', label: 'Outro' },
];

const PLANS: Plan[] = ['Free', 'Premium', 'Empresarial'];

const PLACES = [...Object.values(UF_NAMES), ...CITIES.map((c) => c.city)];

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export default function FiltersSheet() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { sessions, users, suspects, filters, setFilters } = useData();
  const [draft, setDraft] = useState<Filters>(filters);
  const [place, setPlace] = useState('');

  const [progress] = useState(() => new Animated.Value(0));
  const now = useNow(30_000);
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [progress]);

  const close = (after?: () => void) => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      after?.();
      router.back();
    });
  };

  const count = useMemo(
    () => applyFilters(sessions, users, draft, suspects, now).length,
    [sessions, users, draft, suspects, now],
  );

  const suggestions = useMemo(() => {
    const q = normalize(place.trim());
    if (!q) return [];
    return PLACES.filter((p) => normalize(p).startsWith(q) && !draft.locations.includes(p)).slice(0, 4);
  }, [place, draft.locations]);

  const addPlace = (p: string) => {
    setDraft((d) => ({ ...d, locations: d.locations.includes(p) ? d.locations : [...d.locations, p] }));
    setPlace('');
  };

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [Dimensions.get('window').height * 0.6, 0],
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop, opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}
        pointerEvents="box-none">
        <Animated.View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 8, transform: [{ translateY }] }]}>
          <View style={s.handle} />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 12 }}>
            <View style={s.titleRow}>
              <Txt variant="sheetTitle">Filtrar acessos</Txt>
              <Pressable hitSlop={10} onPress={() => setDraft(DEFAULT_FILTERS)}>
                <Txt variant="body" color={colors.primaryText}>
                  Limpar
                </Txt>
              </Pressable>
            </View>

            <Field
              icon={Search}
              placeholder="Usuário, e-mail ou IP"
              value={draft.query}
              onChangeText={(query) => setDraft((d) => ({ ...d, query }))}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ marginTop: 18 }}
            />

            <Txt variant="label" color={colors.textMuted} style={s.section}>
              Status
            </Txt>
            <View style={s.wrap}>
              {STATUS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={draft.status === o.value}
                  onPress={() => setDraft((d) => ({ ...d, status: o.value }))}
                />
              ))}
            </View>

            <Txt variant="label" color={colors.textMuted} style={s.section}>
              Dispositivo
            </Txt>
            <View style={s.wrap}>
              {DEVICES.map((dev) => (
                <Chip
                  key={dev}
                  label={dev}
                  selected={draft.devices.includes(dev)}
                  onPress={() => setDraft((d) => ({ ...d, devices: toggle(d.devices, dev) }))}
                />
              ))}
            </View>

            <Txt variant="label" color={colors.textMuted} style={s.section}>
              Período
            </Txt>
            <Segmented options={PERIODS} value={draft.period} onChange={(period) => setDraft((d) => ({ ...d, period }))} />

            <Txt variant="label" color={colors.textMuted} style={s.section}>
              Localização
            </Txt>
            <Field
              placeholder="Cidade ou estado"
              value={place}
              onChangeText={setPlace}
              onSubmitEditing={() => suggestions[0] && addPlace(suggestions[0])}
              returnKeyType="done"
              right={
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {draft.locations.map((loc) => (
                    <Chip
                      key={loc}
                      label={loc}
                      tone="tag"
                      onPress={() => setDraft((d) => ({ ...d, locations: d.locations.filter((l) => l !== loc) }))}
                      right={<X size={13} color={colors.primaryText} strokeWidth={2} />}
                    />
                  ))}
                </View>
              }
            />
            {suggestions.length ? (
              <View style={[s.wrap, { marginTop: 10 }]}>
                {suggestions.map((p) => (
                  <Chip key={p} label={p} onPress={() => addPlace(p)} />
                ))}
              </View>
            ) : null}

            <Txt variant="label" color={colors.textMuted} style={s.section}>
              Plano
            </Txt>
            <View style={s.wrap}>
              {PLANS.map((p) => (
                <Chip
                  key={p}
                  label={p}
                  selected={draft.plans.includes(p)}
                  onPress={() => setDraft((d) => ({ ...d, plans: toggle(d.plans, p) }))}
                />
              ))}
            </View>

            <Txt variant="label" color={colors.textMuted} style={s.section}>
              Módulo
            </Txt>
            <View style={s.wrap}>
              {MODULES.map((m) => (
                <Chip
                  key={m.id}
                  label={m.short}
                  selected={draft.modules.includes(m.id)}
                  onPress={() => setDraft((d) => ({ ...d, modules: toggle(d.modules, m.id) }))}
                />
              ))}
            </View>

            <Button
              label={`Mostrar ${count} ${count === 1 ? 'sessão' : 'sessões'}`}
              onPress={() => close(() => setFilters(draft))}
              style={{ marginTop: 28, marginBottom: 4 }}
            />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  sheet: {
    maxHeight: '90%',
    backgroundColor: c.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: c.border,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.borderStrong,
    marginTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  section: {
    marginTop: 24,
    marginBottom: 10,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
}));
