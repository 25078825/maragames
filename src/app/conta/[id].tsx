import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Ellipsis, TriangleAlert } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, Chip, gutter, IconButton, Screen, Txt } from '@/components/primitives';
import { SessionCard } from '@/components/rows';
import { useAuth } from '@/data/AuthProvider';
import { useData } from '@/data/DataProvider';
import { formatClock, uniqueCities } from '@/data/selectors';
import { MIN } from '@/data/mock';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

export default function AccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { canManage } = useAuth();
  const { users, byUser, planLimits, endSession, endAllSessions, blockUser, unblockUser } = useData();

  const user = users[id];
  if (!user) {
    return (
      <Screen>
        <View style={s.topBar}>
          <IconButton icon={ChevronLeft} onPress={() => router.back()} />
        </View>
        <Txt variant="mono" color={colors.textMuted} style={{ paddingHorizontal: gutter }}>
          conta não encontrada
        </Txt>
      </Screen>
    );
  }

  const sessions = byUser.get(user.id) ?? [];
  const limit = planLimits[user.plan];
  const over = sessions.length > limit;
  const cities = uniqueCities(sessions);

  let warningTitle = '';
  let warningText = '';
  if (user.blocked) {
    warningTitle = 'Conta bloqueada.';
    warningText = ' Novas sessões são recusadas até o bloqueio ser revertido.';
  } else if (over && cities.length > 1) {
    const span = Math.max(1, Math.round((sessions[sessions.length - 1].startedAt - sessions[0].startedAt) / MIN));
    warningTitle = 'Acesso simultâneo suspeito.';
    warningText = ` Logins em ${cities.length} cidades diferentes num intervalo de ${span} minutos.`;
  } else if (over) {
    warningTitle = 'Limite do plano excedido.';
    warningText = ` ${sessions.length} sessões ativas para um limite de ${limit}.`;
  }

  const confirmEnd = (sessionId: string, title: string) =>
    Alert.alert('Encerrar sessão', `Encerrar a sessão em ${title}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Encerrar', style: 'destructive', onPress: () => endSession(sessionId) },
    ]);

  const confirmEndAll = () =>
    Alert.alert('Encerrar todas', `Encerrar as ${sessions.length} sessões de ${user.handle}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Encerrar todas', style: 'destructive', onPress: () => endAllSessions(user.id) },
    ]);

  const confirmBlock = () =>
    user.blocked
      ? Alert.alert('Reverter bloqueio', `Liberar o acesso de ${user.handle}?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reverter', onPress: () => unblockUser(user.id) },
        ])
      : Alert.alert('Bloquear conta', `Bloquear ${user.handle} e encerrar todas as sessões?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Bloquear', style: 'destructive', onPress: () => blockUser(user.id) },
        ]);

  const openMenu = () =>
    Alert.alert(user.handle, undefined, [
      { text: 'Ver histórico', onPress: () => router.navigate({ pathname: '/historico', params: { q: user.handle } }) },
      { text: 'Cancelar', style: 'cancel' },
    ]);

  return (
    <Screen>
      <View style={s.topBar}>
        <IconButton icon={ChevronLeft} onPress={() => router.back()} />
        <Txt variant="h2">Detalhes da conta</Txt>
        <IconButton icon={Ellipsis} onPress={openMenu} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 }}>
          <Avatar user={user} size={60} />
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="name" numberOfLines={1}>
              {user.name}
            </Txt>
            <Txt variant="mono" color={colors.textMuted} numberOfLines={1}>
              {user.email}
            </Txt>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
          <Chip label={`Plano ${user.plan}`} />
          <Chip label={`Limite: ${limit} ${limit === 1 ? 'sessão' : 'sessões'}`} />
          <Chip
            label={`${sessions.length} ${sessions.length === 1 ? 'ativa' : 'ativas'}`}
            tone={over ? 'danger' : 'success'}
          />
          {user.blocked ? <Chip label="Bloqueada" tone="danger" /> : null}
        </View>

        {warningTitle ? (
          <View style={s.warning}>
            <TriangleAlert size={18} color={colors.dangerText} strokeWidth={1.8} style={{ marginTop: 1 }} />
            <Text style={s.warningText}>
              <Text style={{ fontFamily: fonts.sansSemiBold }}>{warningTitle}</Text>
              {warningText}
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 }}>
          <Txt variant="h2">Sessões ativas</Txt>
          <Txt variant="mono" color={colors.textMuted}>
            {sessions.length}
          </Txt>
        </View>

        <View style={{ gap: 12 }}>
          {sessions.map((session, i) => (
            <SessionCard
              key={session.id}
              session={session}
              since={`desde ${formatClock(session.startedAt)}${i === 0 && sessions.length > 1 ? ' · primeira sessão' : ''}`}
              action={
                <Pressable
                  hitSlop={10}
                  disabled={!canManage}
                  onPress={() => confirmEnd(session.id, session.title)}>
                  <Txt variant="body" color={canManage ? colors.dangerText : colors.textFaint}>
                    Encerrar
                  </Txt>
                </Pressable>
              }
            />
          ))}
          {sessions.length === 0 ? (
            <Txt variant="mono" color={colors.textMuted}>
              nenhuma sessão ativa
            </Txt>
          ) : null}
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        <Button
          label={user.blocked ? 'Reverter bloqueio' : 'Bloquear conta'}
          variant="outline"
          disabled={!canManage}
          onPress={confirmBlock}
          style={{ flex: 1 }}
        />
        <Button
          label="Encerrar todas"
          variant="danger"
          disabled={!canManage || sessions.length === 0}
          onPress={confirmEndAll}
          style={{ flex: 1.33 }}
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((c) => ({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingTop: 10,
    paddingBottom: 16,
  },
  warning: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.dangerBorder,
    backgroundColor: c.dangerBg,
  },
  warningText: {
    flex: 1,
    color: c.text,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: gutter,
    paddingTop: 12,
  },
}));
