import { router } from 'expo-router';
import { Bell, ListFilter } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { TabHeader, SectionHeader } from '@/components/headers';
import { Card, Divider, gutter, IconButton, ProgressBar, Screen, Txt } from '@/components/primitives';
import { AttentionCard, SessionRow, StatTile } from '@/components/rows';
import { Sparkline } from '@/components/Sparkline';
import { useAuth } from '@/data/AuthProvider';
import { useData } from '@/data/DataProvider';
import { activityLine, activityCompact, isIdle, MODULE_BY_ID } from '@/data/modules';
import {
  activeFilterCount,
  applyFilters,
  formatClock,
  formatDuration,
  isActive,
} from '@/data/selectors';
import type { AlertItem, Session } from '@/data/types';
import { useNow } from '@/data/useNow';
import { useTheme } from '@/theme/ThemeProvider';

const ALERT_PRIORITY: Record<AlertItem['kind'], number> = {
  simultaneo: 0,
  limite: 1,
  bloqueio: 2,
  novoDispositivo: 3,
  parado: 4,
};

function LiveCard() {
  const { colors } = useTheme();
  const { active, series, hourBase, lastUpdate } = useData();
  const now = useNow(1000);
  const seconds = Math.max(0, Math.round((now - lastUpdate) / 1000));
  const delta = active.length - hourBase;

  return (
    <Card style={{ overflow: 'hidden', paddingTop: 18 }}>
      <View style={{ paddingHorizontal: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt variant="label" color={colors.textMuted}>
            Sessões ativas
          </Txt>
          <Txt variant="monoSmall" color={colors.textFaint}>
            {`atualizado há ${seconds}s`}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: 8 }}>
          <Txt variant="display">{active.length}</Txt>
          <Txt variant="mono" color={delta >= 0 ? colors.success : colors.dangerText} style={{ marginBottom: 12 }}>
            {`${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} na última hora`}
          </Txt>
        </View>
      </View>
      <Sparkline data={series} />
    </Card>
  );
}

export default function LiveScreen() {
  const { colors } = useTheme();
  const { user: admin } = useAuth();
  const data = useData();
  const { users, sessions, active, openAlerts, byUser, suspects, filters, peak, planLimits } = data;
  const now = useNow(30_000);

  const rows = useMemo(() => {
    const filtered = applyFilters(sessions, users, filters, suspects, now);
    const latest = new Map<string, Session>();
    for (const s of filtered) {
      const current = latest.get(s.userId);
      if (!current || s.startedAt > current.startedAt) latest.set(s.userId, s);
    }
    return [...latest.values()].sort((a, b) => b.startedAt - a.startedAt);
  }, [sessions, users, filters, suspects, now]);

  const moduleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of active) {
      if (!s.activity) continue;
      counts.set(s.activity.moduleId, (counts.get(s.activity.moduleId) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [active]);
  const topModules = moduleCounts.slice(0, 5);
  const maxModule = topModules[0]?.[1] ?? 1;

  const mobileShare = active.length
    ? Math.round((active.filter((s) => s.kind === 'mobile').length / active.length) * 100)
    : 0;

  const topAlert = [...openAlerts].sort((a, b) => ALERT_PRIORITY[a.kind] - ALERT_PRIORITY[b.kind])[0];
  const topUser = topAlert ? users[topAlert.userId] : undefined;
  const topSessions = topAlert ? (byUser.get(topAlert.userId) ?? []) : [];

  let attentionLine = '';
  let attentionMeta = '';
  if (topAlert && topUser) {
    if (topAlert.kind === 'simultaneo' || topAlert.kind === 'limite') {
      attentionLine = `${topSessions.length} sessões · limite do plano ${topUser.plan} é ${planLimits[topUser.plan]}`;
      attentionMeta = [...new Set(topSessions.map((s) => s.city))].join(' · ');
    } else {
      attentionLine = topAlert.detail;
      attentionMeta = topAlert.kind === 'bloqueio' ? 'conta bloqueada' : 'novo dispositivo';
    }
  }

  const roleLabel = admin?.role === 'suporte' ? 'Suporte' : 'Admin';
  const filterCount = activeFilterCount(filters);

  const header = (
    <View>
      <TabHeader
        label={`${roleLabel} · ${admin?.name ?? ''}`}
        title="Ao vivo"
        right={<IconButton icon={Bell} dot={openAlerts.length > 0} onPress={() => router.navigate('/alertas')} />}
      />
      <View style={{ paddingHorizontal: gutter, gap: 12 }}>
        <LiveCard />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile value={String(openAlerts.length)} label="suspeitas" danger />
          <StatTile value={`${mobileShare}%`} label="no celular" />
          <StatTile value={String(peak.value)} label={`pico às ${peak.hour}h`} />
        </View>
      </View>

      <View style={{ paddingHorizontal: gutter, marginTop: 26 }}>
        <SectionHeader
          title="Precisa de atenção"
          right={`${openAlerts.length} ${openAlerts.length === 1 ? 'aberto' : 'abertos'}`}
          rightColor={openAlerts.length ? colors.dangerText : undefined}
          onPressRight={() => router.navigate('/alertas')}
        />
        {topAlert && topUser ? (
          <AttentionCard
            user={topUser}
            line={attentionLine}
            meta={attentionMeta}
            onPress={() => router.push({ pathname: '/conta/[id]', params: { id: topUser.id } })}
          />
        ) : (
          <Txt variant="mono" color={colors.textMuted}>
            nenhum alerta aberto
          </Txt>
        )}
      </View>

      <View style={{ paddingHorizontal: gutter, marginTop: 26 }}>
        <SectionHeader
          title="Por módulo"
          right="ver todos"
          rightColor={colors.primaryText}
          rightMono={false}
          onPressRight={() => router.navigate({ pathname: '/alunos', params: { aba: 'modulos' } })}
        />
        <Card style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
          {topModules.map(([moduleId, count], i) => (
            <View key={moduleId}>
              {i > 0 ? <Divider /> : null}
              <Pressable
                onPress={() => router.navigate({ pathname: '/alunos', params: { modulo: moduleId } })}
                style={({ pressed }) => [{ paddingVertical: 11, gap: 8 }, pressed && { opacity: 0.6 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt variant="small" numberOfLines={1} style={{ flex: 1 }}>
                    {MODULE_BY_ID[moduleId]?.name}
                  </Txt>
                  <Txt variant="mono" color={colors.textMuted}>
                    {count}
                  </Txt>
                </View>
                <ProgressBar value={count / maxModule} height={4} />
              </Pressable>
            </View>
          ))}
        </Card>
      </View>

      <View style={{ paddingHorizontal: gutter, marginTop: 26 }}>
        <SectionHeader
          title={filters.status === 'encerrados' ? 'Sessões encerradas' : 'Conectados agora'}
          right={filterCount ? `Filtrar (${filterCount})` : 'Filtrar'}
          rightIcon={ListFilter}
          rightColor={colors.primaryText}
          rightMono={false}
          onPressRight={() => router.push('/filtros')}
        />
      </View>
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={rows}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 24 }}
        initialNumToRender={12}
        ListEmptyComponent={
          <Txt variant="mono" color={colors.textMuted} style={{ paddingHorizontal: gutter }}>
            nenhuma sessão com esses filtros
          </Txt>
        }
        renderItem={({ item, index }) => {
          const u = users[item.userId];
          if (!u) return null;
          const a = item.activity;
          const idle = isActive(item) && isIdle(a, now);
          const subtitle = !a
            ? `${item.system} · ${item.city}, ${item.uf}`
            : idle
              ? `parado há ${formatDuration(now - a.lastActionAt)} · ${activityCompact(a)}`
              : activityLine(a);
          return (
            <View style={{ paddingHorizontal: gutter }}>
              <SessionRow
                user={u}
                subtitle={subtitle}
                subtitleColor={idle ? colors.warning : undefined}
                right={
                  isActive(item)
                    ? formatDuration(now - item.startedAt)
                    : `saiu ${formatClock(item.endedAt ?? now)}`
                }
                last={index === rows.length - 1}
                onPress={() => router.push({ pathname: '/conta/[id]', params: { id: u.id } })}
              />
            </View>
          );
        }}
      />
    </Screen>
  );
}
