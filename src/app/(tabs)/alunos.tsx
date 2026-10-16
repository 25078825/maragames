import { router, useLocalSearchParams } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, SectionList, View } from 'react-native';

import { TabHeader } from '@/components/headers';
import { Avatar, Card, Chip, Field, gutter, ProgressBar, Screen, Segmented, Txt } from '@/components/primitives';
import { SessionRow } from '@/components/rows';
import { useData } from '@/data/DataProvider';
import { activityCompact, activityLine, isIdle, levelFor, MODULE_BY_ID, MODULES } from '@/data/modules';
import { formatDuration, pad } from '@/data/selectors';
import type { Session, User } from '@/data/types';
import { useNow } from '@/data/useNow';
import { useTheme } from '@/theme/ThemeProvider';

type Tab = 'agora' | 'modulos' | 'ranking';

function formatXp(xp: number) {
  return xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function StudentsScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ modulo?: string; aba?: string }>();
  const { users, byUser } = useData();
  const now = useNow(15_000);

  const [tab, setTab] = useState<Tab>(params.aba === 'modulos' ? 'modulos' : 'agora');
  const [moduleFilter, setModuleFilter] = useState<string | undefined>(params.modulo);
  const [query, setQuery] = useState('');

  // parâmetros vindos de outras telas (Ao vivo > Por módulo)
  const [prevParams, setPrevParams] = useState(params);
  if (params.modulo !== prevParams.modulo || params.aba !== prevParams.aba) {
    setPrevParams(params);
    if (params.modulo) {
      setModuleFilter(params.modulo);
      setTab('agora');
    } else if (params.aba === 'modulos') {
      setTab('modulos');
    }
  }

  /** Aluno conectado + a sessão mais recente dele. */
  const studying = useMemo(() => {
    const list: { user: User; session: Session }[] = [];
    for (const [userId, sessions] of byUser) {
      const user = users[userId];
      const session = sessions[sessions.length - 1];
      if (user && session?.activity) list.push({ user, session });
    }
    return list;
  }, [byUser, users]);

  const idleCount = studying.filter((x) => isIdle(x.session.activity, now)).length;

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = studying.filter(({ user, session }) => {
      if (moduleFilter && session.activity?.moduleId !== moduleFilter) return false;
      if (q && !`${user.handle} ${user.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const idle = filtered
      .filter((x) => isIdle(x.session.activity, now))
      .sort((a, b) => (a.session.activity?.lastActionAt ?? 0) - (b.session.activity?.lastActionAt ?? 0));
    const active = filtered
      .filter((x) => !isIdle(x.session.activity, now))
      .sort((a, b) => (b.session.activity?.lastActionAt ?? 0) - (a.session.activity?.lastActionAt ?? 0));
    return [
      ...(idle.length ? [{ title: 'Parados', warn: true, data: idle }] : []),
      { title: 'Estudando agora', warn: false, data: active },
    ];
  }, [studying, moduleFilter, query, now]);

  const moduleStats = useMemo(() => {
    const allUsers = Object.values(users);
    return MODULES.map((m) => {
      const count = studying.filter((x) => x.session.activity?.moduleId === m.id).length;
      const started = allUsers.filter((u) => (u.progress[m.id] ?? 0) > 0);
      const avg = started.length
        ? started.reduce((sum, u) => sum + Math.min(1, u.progress[m.id] / m.lessons), 0) / started.length
        : 0;
      return { module: m, now: count, started: started.length, avg };
    });
  }, [users, studying]);

  const ranking = useMemo(
    () =>
      Object.values(users)
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 50),
    [users],
  );

  const openUser = (id: string) => router.push({ pathname: '/conta/[id]', params: { id } });

  return (
    <Screen>
      <TabHeader label={`${studying.length} estudando · ${idleCount} parados`} title="Alunos" />
      <View style={{ paddingHorizontal: gutter, marginBottom: 12 }}>
        <Segmented
          options={[
            { value: 'agora', label: 'Agora' },
            { value: 'modulos', label: 'Módulos' },
            { value: 'ranking', label: 'Ranking' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {tab === 'agora' ? (
        <SectionList
          sections={sections}
          keyExtractor={(x) => x.session.id}
          stickySectionHeadersEnabled={false}
          initialNumToRender={14}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24 }}
          ListHeaderComponent={
            <View style={{ gap: 10, marginBottom: 4 }}>
              <Field
                icon={Search}
                placeholder="Nome ou e-mail do aluno"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {moduleFilter ? (
                <View style={{ flexDirection: 'row' }}>
                  <Chip
                    label={MODULE_BY_ID[moduleFilter]?.name ?? moduleFilter}
                    tone="tag"
                    onPress={() => setModuleFilter(undefined)}
                    right={<X size={13} color={colors.primaryText} strokeWidth={2} />}
                  />
                </View>
              ) : null}
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 2 }}>
              <Txt variant="caption" color={section.warn ? colors.primaryText : colors.textMuted}>
                {section.title}
              </Txt>
              <Txt variant="micro" color={colors.textFaint}>
                {section.data.length}
              </Txt>
            </View>
          )}
          ListEmptyComponent={
            <Txt variant="caption" color={colors.textMuted} style={{ marginTop: 16 }}>
              nenhum aluno encontrado
            </Txt>
          }
          renderItem={({ item, index, section }) => {
            const a = item.session.activity!;
            const idle = isIdle(a, now);
            return (
              <SessionRow
                user={item.user}
                subtitle={idle ? `parado · ${activityCompact(a)}` : activityLine(a)}
                subtitleColor={idle ? colors.primaryText : undefined}
                right={idle ? formatDuration(now - a.lastActionAt) : formatDuration(now - a.since)}
                last={index === section.data.length - 1}
                onPress={() => openUser(item.user.id)}
              />
            );
          }}
        />
      ) : null}

      {tab === 'modulos' ? (
        <FlatList
          data={moduleStats}
          keyExtractor={(x) => x.module.id}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24, gap: 10 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setModuleFilter(item.module.id);
                setTab('agora');
              }}>
              {({ pressed }) => (
                <Card style={{ padding: 16, gap: 8, opacity: pressed ? 0.7 : 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Txt variant="caption" color={colors.textMuted}>
                        {`Módulo ${pad(item.module.n)}`}
                      </Txt>
                      {item.module.premium ? (
                        <Txt variant="caption" color={colors.primaryText}>
                          Premium
                        </Txt>
                      ) : null}
                    </View>
                    <Txt variant="caption" color={item.now ? colors.text : colors.textFaint}>
                      {`${item.now} agora`}
                    </Txt>
                  </View>
                  <Txt variant="heading">{item.module.name}</Txt>
                  <ProgressBar value={item.avg} height={4} />
                  <Txt variant="micro" color={colors.textMuted}>
                    {`${item.started} alunos · média ${Math.round(item.avg * 100)}% · ${item.module.lessons} lições`}
                  </Txt>
                </Card>
              )}
            </Pressable>
          )}
        />
      ) : null}

      {tab === 'ranking' ? (
        <FlatList
          data={ranking}
          keyExtractor={(u) => u.id}
          initialNumToRender={14}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24 }}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => openUser(item.id)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  borderBottomWidth: index === ranking.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border,
                },
                pressed && { opacity: 0.6 },
              ]}>
              <Txt variant="caption" color={index < 3 ? colors.primaryText : colors.textFaint} style={{ width: 22 }}>
                {pad(index + 1)}
              </Txt>
              <Avatar user={item} />
              <View style={{ flex: 1, gap: 3 }}>
                <Txt variant="bodyStrong" numberOfLines={1}>
                  {item.handle}
                </Txt>
                <Txt variant="micro" color={colors.textMuted} numberOfLines={1}>
                  {`nível ${levelFor(item.xp)} · ${item.streak} dias seguidos`}
                </Txt>
              </View>
              <Txt variant="caption" color={colors.textMuted}>
                {`${formatXp(item.xp)} XP`}
              </Txt>
            </Pressable>
          )}
        />
      ) : null}
    </Screen>
  );
}
