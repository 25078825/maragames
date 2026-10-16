import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TintName, User } from '@/data/types';
import { initials } from '@/data/selectors';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, space, type } from '@/theme/tokens';

const textVariants = type;

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

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return <View style={[{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }, style]}>{children}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const s = useStyles();
  return <View style={[s.card, style]}>{children}</View>;
}

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
  const t = colors.tints[tint ?? 'neutral'];
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
          fontFamily: fonts.semibold,
          fontSize: large ? 20 : 13,
        }}>
        {label ?? (user ? initials(user) : '')}
      </Text>
    </View>
  );
}

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
      <Txt variant="caption" color={textColor}>
        {label}
      </Txt>
      {right}
    </Pressable>
  );
}

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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        size === 'lg' ? s.btnLg : s.btnSm,
        { backgroundColor: bg },
        variant === 'outline' && s.btnOutline,
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 },
        style,
      ]}>
      <Text
        numberOfLines={1}
        style={{
          color: fg,
          ...(size === 'lg' ? type.bodyStrong : type.caption),
          fontFamily: fonts.medium,
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

export function ProgressBar({ value, color, height = 6 }: { value: number; color?: string; height?: number }) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: colors.border, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: height / 2, backgroundColor: color ?? colors.primary }} />
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />;
}

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
    fontFamily: fonts.regular,
    fontSize: 15,
    paddingVertical: 0,
  },
}));

export const gutter = space.gutter;
