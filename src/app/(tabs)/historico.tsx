import { router, useLocalSearchParams } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, SectionList, Share, View } from 'react-native';

import { TabHeader } from '@/components/headers';
import { Button, Field, gutter, Screen, Segmented, Txt } from '@/components/primitives';
import { SessionRow } from '@/components/rows';
import { useData } from '@/data/DataProvider';
import { DAY } from '@/data/mock';
import { formatClock, formatDateTime, formatDayLabel, startOfDay } from '@/data/selectors';
import type { Session } from '@/data/types';
import { useNow } from '@/data/useNow';
import { useTheme } from '@/theme/ThemeProvider';

type Range = 'hoje' | '7d' | '30d';

type HistoryEvent = {
  key: string;
  type: 'login' | 'logout';
  at: number;
  session: Session;
};

const RANGE_DAYS: Record<Range, number> = { hoje: 1, '7d': 7, '30d': 30 };

function csvEscape(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { sessions, users } = useData();
  const [range, setRange] = useState<Range>('hoje');
  const [query, setQuery] = useState(q ?? '');
  const now = useNow(30_000);

  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    setQuery(q ?? '');
  }

  const events = useMemo(() => {
    const from = startOfDay(now) - (RANGE_DAYS[range] - 1) * DAY;
    const term = query.trim().toLowerCase();
    const list: HistoryEvent[] = [];
    for (const s of sessions) {
      if (term) {
        const u = users[s.userId];
        const hay = `${u?.handle ?? ''} ${u?.email ?? ''} ${s.ip}`.toLowerCase();
        if (!hay.includes(term)) continue;
      }
      if (s.startedAt >= from) list.push({ key: `${s.id}-in`, type: 'login', at: s.startedAt, session: s });
      if (s.endedAt !== undefined && s.endedAt >= from)
        list.push({ key: `${s.id}-out`, type: 'logout', at: s.endedAt, session: s });
    }
    return list.sort((a, b) => b.at - a.at);
  }, [sessions, users, range, query, now]);

  const sections = useMemo(() => {
    const groups = new Map<number, HistoryEvent[]>();
    for (const e of events) {
      const day = startOfDay(e.at);
      const g = groups.get(day);
      if (g) g.push(e);
      else groups.set(day, [e]);
    }
    return [...groups.entries()].map(([day, data]) => ({ title: formatDayLabel(day, now), data }));
  }, [events, now]);

  const todayCount = useMemo(() => {
    const today = startOfDay(now);
    let n = 0;
    for (const s of sessions) {
      if (s.startedAt >= today) n++;
      if (s.endedAt !== undefined && s.endedAt >= today) n++;
    }
    return n;
  }, [sessions, now]);

  const exportCsv = async () => {
    const header = 'usuario,email,evento,data_hora,dispositivo,sistema,ip,cidade,uf';
    const lines = events.map((e) => {
      const u = users[e.session.userId];
      return [
        u?.handle ?? '',
        u?.email ?? '',
        e.type === 'login' ? 'login' : 'logout',
        formatDateTime(e.at),
        e.session.title,
        e.session.system,
        e.session.ip,
        e.session.city,
        e.session.uf,
      ]
        .map(csvEscape)
        .join(',');
    });
    try {
      await Share.share({ title: 'acessos-maragames.csv', message: [header, ...lines].join('\n') });
    } catch {
      Alert.alert('Exportar CSV', 'Não foi possível compartilhar o arquivo.');
    }
  };

  return (
    <Screen>
      <TabHeader
        label={`${todayCount} eventos hoje`}
        title="Histórico"
        right={<Button label="Exportar CSV" variant="outline" size="sm" onPress={exportCsv} style={{ marginBottom: 6 }} />}
      />
      <View style={{ paddingHorizontal: gutter, gap: 12, marginBottom: 8 }}>
        <Field
          icon={Search}
          placeholder="Usuário, e-mail ou IP"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Segmented
          options={[
            { value: 'hoje', label: 'Hoje' },
            { value: '7d', label: '7 dias' },
            { value: '30d', label: '30 dias' },
          ]}
          value={range}
          onChange={setRange}
        />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(e) => e.key}
        stickySectionHeadersEnabled={false}
        initialNumToRender={16}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24 }}
        ListEmptyComponent={
          <Txt variant="caption" color={colors.textMuted} style={{ marginTop: 16 }}>
            nenhum evento no período
          </Txt>
        }
        renderSectionHeader={({ section }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 2 }}>
            <Txt variant="caption" color={colors.textMuted}>
              {section.title}
            </Txt>
            <Txt variant="micro" color={colors.textFaint}>
              {section.data.length}
            </Txt>
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const u = users[item.session.userId];
          if (!u) return null;
          const s = item.session;
          return (
            <SessionRow
              user={u}
              subtitle={`${item.type === 'login' ? 'entrou' : 'saiu'} · ${s.system} · ${s.city}, ${s.uf}`}
              right={formatClock(item.at)}
              last={index === section.data.length - 1}
              onPress={() => router.push({ pathname: '/conta/[id]', params: { id: u.id } })}
            />
          );
        }}
      />
    </Screen>
  );
}
