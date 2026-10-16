import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, View } from 'react-native';

import { TabHeader } from '@/components/headers';
import { Button, gutter, Screen, Segmented, Txt } from '@/components/primitives';
import { AlertCard } from '@/components/rows';
import { useAuth } from '@/data/AuthProvider';
import { useData } from '@/data/DataProvider';
import { startOfDay } from '@/data/selectors';
import type { AlertItem } from '@/data/types';
import { useNow } from '@/data/useNow';
import { useTheme } from '@/theme/ThemeProvider';

type Tab = 'abertos' | 'resolvidos';

export default function AlertsScreen() {
  const { colors } = useTheme();
  const { canManage } = useAuth();
  const { openAlerts, resolvedAlerts, users, endAllSessions, unblockUser } = useData();
  const [tab, setTab] = useState<Tab>('abertos');
  const now = useNow(30_000);

  const resolvedToday = resolvedAlerts.filter((a) => (a.resolvedAt ?? 0) >= startOfDay(now)).length;
  const list = tab === 'abertos' ? openAlerts : resolvedAlerts;

  const openAccount = (a: AlertItem) => router.push({ pathname: '/conta/[id]', params: { id: a.userId } });

  const confirmEndAll = (a: AlertItem) => {
    const u = users[a.userId];
    Alert.alert('Encerrar sessões', `Encerrar todas as sessões de ${u?.handle}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Encerrar', style: 'destructive', onPress: () => endAllSessions(a.userId) },
    ]);
  };

  const confirmRevert = (a: AlertItem) => {
    const u = users[a.userId];
    Alert.alert('Reverter bloqueio', `Liberar o acesso de ${u?.handle}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reverter', onPress: () => unblockUser(a.userId) },
    ]);
  };

  const actionsFor = (a: AlertItem) => {
    if (a.resolvedAt) return null;
    if (a.kind === 'simultaneo') {
      return (
        <>
          <Button label="Encerrar sessões" variant="danger" size="sm" disabled={!canManage} onPress={() => confirmEndAll(a)} />
          <Button label="Ver detalhes" variant="outline" size="sm" onPress={() => openAccount(a)} />
        </>
      );
    }
    if (a.kind === 'bloqueio') {
      return <Button label="Reverter bloqueio" variant="outline" size="sm" disabled={!canManage} onPress={() => confirmRevert(a)} />;
    }
    return null;
  };

  return (
    <Screen>
      <TabHeader label={`${openAlerts.length} abertos · ${resolvedToday} resolvidos hoje`} title="Alertas" />
      <View style={{ paddingHorizontal: gutter, marginBottom: 16 }}>
        <Segmented
          options={[
            { value: 'abertos', label: 'Abertos' },
            { value: 'resolvidos', label: 'Resolvidos' },
          ]}
          value={tab}
          onChange={setTab}
          badges={{ abertos: openAlerts.length }}
        />
      </View>
      <FlatList
        data={list}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24, gap: 12 }}
        ListEmptyComponent={
          <Txt variant="mono" color={colors.textMuted}>
            {tab === 'abertos' ? 'nenhum alerta aberto' : 'nenhum alerta resolvido'}
          </Txt>
        }
        renderItem={({ item }) => (
          <AlertCard alert={item} now={now} actions={actionsFor(item)} onPress={() => openAccount(item)} />
        )}
      />
    </Screen>
  );
}
