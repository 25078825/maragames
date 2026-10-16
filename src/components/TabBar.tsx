import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Activity, Clock, GraduationCap, SlidersHorizontal, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useData } from '@/data/DataProvider';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/tokens';

import { Txt } from './primitives';

const ITEMS: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: 'Ao vivo', icon: Activity },
  alunos: { label: 'Alunos', icon: GraduationCap },
  alertas: { label: 'Alertas', icon: TriangleAlert },
  historico: { label: 'Histórico', icon: Clock },
  ajustes: { label: 'Ajustes', icon: SlidersHorizontal },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { openAlerts } = useData();

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const item = ITEMS[route.name];
        if (!item) return null;
        const focused = state.index === index;
        const color = focused ? colors.text : colors.textFaint;
        const Icon = item.icon;
        const badge = route.name === 'alertas' ? openAlerts.length : 0;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={s.item}>
            {focused ? <View style={s.indicator} /> : null}
            <View>
              <Icon size={21} color={color} strokeWidth={1.7} />
              {badge > 0 ? (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </View>
            <Txt variant="micro" color={color} style={{ marginTop: 7 }}>
              {item.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  bar: {
    flexDirection: 'row',
    backgroundColor: c.bg,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 14,
  },
  indicator: {
    position: 'absolute',
    top: -1,
    width: 22,
    height: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: c.primary,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: c.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: c.bg,
  },
  badgeText: {
    color: '#FFFFFF',
    ...type.micro,
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 13,
  },
}));
