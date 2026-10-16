import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { gutter, Txt } from './primitives';

export function TabHeader({ label, title, right }: { label: string; title: string; right?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: gutter,
        paddingTop: 14,
        paddingBottom: 18,
      }}>
      <View style={{ gap: 6 }}>
        <Txt variant="caption" color={colors.textMuted}>
          {label}
        </Txt>
        <Txt variant="title">{title}</Txt>
      </View>
      {right}
    </View>
  );
}

export function SectionHeader({
  title,
  right,
  rightColor,
  rightIcon: Icon,
  onPressRight,
  rightMono = true,
}: {
  title: string;
  right?: string;
  rightColor?: string;
  rightIcon?: LucideIcon;
  onPressRight?: () => void;
  rightMono?: boolean;
}) {
  const { colors } = useTheme();
  const color = rightColor ?? colors.textMuted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Txt variant="heading">{title}</Txt>
      {right ? (
        <Pressable
          onPress={onPressRight}
          disabled={!onPressRight}
          hitSlop={10}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {Icon ? <Icon size={15} color={color} strokeWidth={1.8} /> : null}
          <Txt variant={rightMono ? 'caption' : 'body'} color={color}>
            {right}
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}
