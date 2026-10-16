import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TintName, User } from '@/data/types';
import { initials } from '@/data/selectors';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, space } from '@/theme/tokens';

/* ---------- Texto ---------- */

const textVariants = {
  display: { fontFamily: fonts.sansBold, fontSize: 56, lineHeight: 64, letterSpacing: -2.5 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  sheetTitle: { fontFamily: fonts.sansSemiBold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  stat: { fontFamily: fonts.sansSemiBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.sansMedium, fontSize: 16, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  tab: { fontFamily: fonts.sans, fontSize: 11.5, lineHeight: 14 },
  mono: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 17 },
  monoSmall: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 15 },
  label: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 14, letterSpacing: 2.2, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textVariants;

export function Txt({
  variant = 'body',
  color,
  style,
  ...rest
}: TextProps & { variant?: TextVariant; color?: string }) {
  const { colors } = useTheme();
  return <Text {...rest} style={[textVariants[variant], { color: color ?? colors.text }, style]} />;
}

/* ---------- Tela ---------- */

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return <View style={[{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }, style]}>{children}</View>;
}

/* ---------- Card ---------- */

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const s = useStyles();
  return <View style={[s.card, style]}>{children}</View>;
}

/* ---------- Avatar ---------- */

export function Avatar({
  user,
  label,
  tint,
  size = 38,
}: {
  user?: User;
  label?: string;
  tint?: TintName;
  size?: number;
}) {
  const { colors } = useTheme();
  const t = colors.tints[tint ?? user?.tint ?? 'purple'];
  const large = size >= 50;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: large ? 14 : 10,
        backgroundColor: t.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          color: t.fg,
          fontFamily: large ? fonts.sansSemiBold : fonts.monoMedium,
          fontSize: large ? 20 : 13,
          letterSpacing: large ? 0 : 0.5,
        }}>
        {label ?? (user ? initials(user) : '')}
      </Text>
    </View>
  );
}

/* ---------- Chip ---------- */

export function Chip({
  label,
  selected,
  tone = 'default',
  onPress,
  right,
}: {
  label: string;
  selected?: boolean;
  tone?: 'default' | 'danger' | 'success' | 'tag';
  onPress?: () => void;
  right?: ReactNode;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const toneStyle =
    tone === 'danger'
      ? { borderColor: colors.dangerBorder, backgroundColor: colors.dangerBg }
      : tone === 'tag'
        ? { borderColor: colors.primary, backgroundColor: colors.primarySoft }
        : tone === 'success'
          ? { borderColor: colors.border }
          : null;
  const textColor = selected
    ? colors.onPrimary
    : tone === 'danger'
      ? colors.dangerText
      : tone === 'tag'
        ? colors.primaryText
        : tone === 'success'
          ? colors.success
          : colors.textMuted;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [s.chip, toneStyle, selected && s.chipSelected, pressed && { opacity: 0.7 }]}>
      <Txt variant="small" color={textColor} style={{ fontSize: 12.5 }}>
        {label}
      </Txt>
      {right}
    </Pressable>
  );
}

/* ---------- Botões ---------- */

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  disabled,
  onPress,
  style,
}: {
  label: string;
  variant?: 'primary' | 'danger' | 'outline';
  size?: 'lg' | 'sm';
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : 'transparent';
  const fg = variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.onDanger : colors.text;
  const glow = variant === 'primary' && size === 'lg' && !disabled ? s.glow : null;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        size === 'lg' ? s.btnLg : s.btnSm,
        { backgroundColor: bg },
        variant === 'outline' && s.btnOutline,
        glow,
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 },
        style,
      ]}>
      <Text
        numberOfLines={1}
        style={{
          color: fg,
          fontFamily: fonts.sansMedium,
          fontSize: size === 'lg' ? 16 : 13,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  icon: Icon,
  onPress,
  dot,
  size = 42,
}: {
  icon: LucideIcon;
  onPress?: () => void;
  dot?: boolean;
  size?: number;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [s.iconBtn, { width: size, height: size }, pressed && { opacity: 0.7 }]}>
      <Icon size={18} color={colors.text} strokeWidth={1.8} />
      {dot ? <View style={s.dot} /> : null}
    </Pressable>
  );
}

/* ---------- Segmentado ---------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  badges,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  badges?: Partial<Record<T, number>>;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        const badge = badges?.[o.value];
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[s.segment, active && s.segmentActive]}>
            <Txt variant="body" color={active ? colors.text : colors.textMuted}>
              {o.label}
              {badge ? <Txt variant="body" color={colors.dangerText}>{`  ${badge}`}</Txt> : null}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Campo ---------- */

export function Field({
  icon: Icon,
  right,
  style,
  ...input
}: TextInputProps & { icon?: LucideIcon; right?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[s.field, style]}>
      {Icon ? <Icon size={16} color={colors.textMuted} strokeWidth={1.8} /> : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        selectionColor={colors.primary}
        {...input}
        style={s.fieldInput}
      />
      {right}
    </View>
  );
}

/* ---------- Divisória ---------- */

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />;
}

/* ---------- Estilos ---------- */

const useStyles = makeStyles((c) => ({
  card: {
    backgroundColor: c.surface,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  chip: {
    height: 30,
    paddingHorizontal: 9,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: c.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipSelected: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  btnLg: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  btnSm: {
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: c.border,
  },
  glow: Platform.select({
    ios: { shadowColor: c.primary, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 8, shadowColor: c.primary },
    default: { boxShadow: `0 6px 22px ${c.primary}66` },
  }),
  iconBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: c.danger,
  },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: 4,
    backgroundColor: c.surface,
  },
  segment: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentActive: {
    backgroundColor: c.surfaceRaised === c.surface ? c.bg : c.surfaceRaised,
    borderColor: c.border,
  },
  field: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.bg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  fieldInput: {
    flex: 1,
    height: '100%',
    color: c.text,
    fontFamily: fonts.sans,
    fontSize: 14,
    paddingVertical: 0,
  },
}));

export const gutter = space.gutter;
