import { ChevronRight, Monitor, Smartphone } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { formatAgo } from '@/data/selectors';
import type { AlertItem, Session, User } from '@/data/types';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

import { Avatar, Card, Divider, Txt } from './primitives';

/* ---------- Tile de estatística ---------- */

export function StatTile({ value, label, danger }: { value: string; label: string; danger?: boolean }) {
  const { colors } = useTheme();
  return (
    <Card style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 13, gap: 4 }}>
      <Txt variant="subtitle" color={danger ? colors.dangerText : colors.text}>
        {value}
      </Txt>
      <Txt variant="caption" color={colors.textMuted}>
        {label}
      </Txt>
    </Card>
  );
}

/* ---------- Linha de usuário conectado ---------- */

export function SessionRow({
  user,
  subtitle,
  right,
  onPress,
  last,
  danger,
  subtitleColor,
}: {
  user: User;
  subtitle: string;
  right: string;
  onPress?: () => void;
  last?: boolean;
  danger?: boolean;
  subtitleColor?: string;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, !last && s.rowDivider, pressed && { opacity: 0.6 }]}>
      <Avatar user={user} tint={danger ? 'red' : undefined} />
      <View style={{ flex: 1, gap: 3 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {user.handle}
        </Txt>
        <Txt variant="micro" color={subtitleColor ?? colors.textMuted} numberOfLines={1}>
          {subtitle}
        </Txt>
      </View>
      <Txt variant="caption" color={colors.textMuted}>
        {right}
      </Txt>
    </Pressable>
  );
}

/* ---------- Card "Precisa de atenção" ---------- */

export function AttentionCard({
  user,
  line,
  meta,
  onPress,
}: {
  user: User;
  line: string;
  meta: string;
  onPress?: () => void;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.attention, pressed && { opacity: 0.8 }]}>
      <Avatar user={user} tint="red" />
      <View style={{ flex: 1, gap: 3 }}>
        <Txt variant="bodyStrong">{user.handle}</Txt>
        <Txt variant="caption" numberOfLines={1}>
          {line}
        </Txt>
        <Txt variant="micro" color={colors.textMuted} numberOfLines={1}>
          {meta}
        </Txt>
      </View>
      <ChevronRight size={18} color={colors.textMuted} strokeWidth={1.8} />
    </Pressable>
  );
}

/* ---------- Card de sessão ativa (detalhes) ---------- */

export function SessionCard({
  session,
  since,
  action,
  activity,
}: {
  session: Session;
  since: string;
  action?: ReactNode;
  activity?: { line: string; meta: string; idle: boolean };
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const Icon = session.kind === 'mobile' ? Smartphone : Monitor;
  return (
    <Card style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={s.deviceIcon}>
          <Icon size={16} color={colors.text} strokeWidth={1.6} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Txt variant="bodyStrong" numberOfLines={1}>
            {session.title}
          </Txt>
          <Txt variant="micro" color={colors.textMuted} numberOfLines={1}>
            {`${session.ip} · ${session.city}, ${session.uf}`}
          </Txt>
        </View>
      </View>
      {activity ? (
        <View style={[s.activity, activity.idle && s.activityIdle]}>
          <Txt variant="caption" numberOfLines={1}>
            {activity.line}
          </Txt>
          <Txt variant="micro" color={activity.idle ? colors.primaryText : colors.textMuted} numberOfLines={1}>
            {activity.meta}
          </Txt>
        </View>
      ) : null}
      <Divider style={{ marginTop: 14, marginBottom: 10 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="micro" color={colors.textFaint}>
          {since}
        </Txt>
        {action}
      </View>
    </Card>
  );
}

/* ---------- Card de alerta ---------- */

export function alertMeta(kind: AlertItem['kind'], colors: ReturnType<typeof useTheme>['colors']) {
  switch (kind) {
    case 'simultaneo':
      return { label: 'Alta · Simultâneo', color: colors.dangerText, bar: colors.danger };
    case 'limite':
      return { label: 'Média · Limite do plano', color: colors.dangerText, bar: colors.danger };
    case 'bloqueio':
      return { label: 'Bloqueio automático', color: colors.primaryText, bar: colors.primary };
    case 'novoDispositivo':
      return { label: 'Baixa · Novo dispositivo', color: colors.textMuted, bar: colors.neutralBar };
    case 'parado':
      return { label: 'Média · Aluno parado', color: colors.primaryText, bar: colors.primary };
  }
}

export function AlertCard({
  alert,
  now,
  actions,
  onPress,
}: {
  alert: AlertItem;
  now: number;
  actions?: ReactNode;
  onPress?: () => void;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const meta = alertMeta(alert.kind, colors);
  const resolved = !!alert.resolvedAt;
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card style={s.alertCard}>
        <View style={[s.alertBar, { backgroundColor: resolved ? colors.neutralBar : meta.bar }]} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt variant="caption" color={resolved ? colors.textMuted : meta.color}>
            {meta.label}
          </Txt>
          <Txt variant="micro" color={colors.textFaint}>
            {resolved ? `resolvido há ${formatAgo(now - (alert.resolvedAt ?? now))}` : formatAgo(now - alert.createdAt)}
          </Txt>
        </View>
        <Txt variant="heading" style={{ marginTop: 10 }}>
          {alert.title}
        </Txt>
        <Txt variant="caption" color={colors.textMuted} style={{ marginTop: 3 }}>
          {alert.detail}
        </Txt>
        {actions ? <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>{actions}</View> : null}
      </Card>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  attention: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.dangerBorder,
    backgroundColor: c.dangerBg,
  },
  deviceIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activity: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: c.bg,
    gap: 3,
  },
  activityIdle: {
    borderWidth: 1,
    borderColor: c.primary,
  },
  alertCard: {
    paddingVertical: 16,
    paddingLeft: 18,
    paddingRight: 16,
    overflow: 'hidden',
  },
  alertBar: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
}));
