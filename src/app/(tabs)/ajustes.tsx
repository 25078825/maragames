import { ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Switch, View } from 'react-native';

import { TabHeader } from '@/components/headers';
import { Avatar, Card, Chip, Divider, gutter, Screen, Segmented, Txt } from '@/components/primitives';
import { useAuth } from '@/data/AuthProvider';
import { useData } from '@/data/DataProvider';
import type { Plan } from '@/data/types';
import { makeStyles, useTheme, type ThemeMode } from '@/theme/ThemeProvider';

const PLANS: Plan[] = ['Free', 'Premium', 'Empresarial'];

const FAQ = [
  {
    q: 'O que é uma sessão suspeita?',
    a: 'Quando a mesma conta tem mais sessões ativas do que o limite do plano, ou aparece em cidades diferentes num intervalo curto.',
  },
  {
    q: 'Quando um aluno é considerado parado?',
    a: 'Quando está conectado, mas sem nenhuma interação na lição, quiz ou minijogo há 15 minutos ou mais.',
  },
  {
    q: 'Como encerrar um acesso?',
    a: 'Abra a conta pelo Ao vivo ou pelos Alertas e toque em Encerrar na sessão. Encerrar todas derruba todas as sessões da conta.',
  },
  {
    q: 'Quem pode encerrar sessões?',
    a: 'Somente administradores. O perfil Suporte visualiza as sessões e reporta comportamentos suspeitos.',
  },
  {
    q: 'Quais dados são coletados?',
    a: 'Usuário, data e hora, dispositivo, sistema, IP e localização aproximada de cada acesso, tratados conforme a LGPD.',
  },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 26 }}>
      <Txt variant="caption" color={colors.textMuted} style={{ marginBottom: 12 }}>
        {title}
      </Txt>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const s = useStyles();
  const { colors, mode, setMode } = useTheme();
  const { user, canManage, signOut } = useAuth();
  const { planLimits, setPlanLimit, notificationsOn, setNotificationsOn, autoBlock, setAutoBlock } = useData();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const roleLabel = user?.role === 'suporte' ? 'Suporte' : 'Admin';
  const switchColors = {
    trackColor: { false: colors.borderStrong, true: colors.primary },
    thumbColor: '#FFFFFF',
    ios_backgroundColor: colors.borderStrong,
    // react-native-web usa activeThumbColor
    ...(Platform.OS === 'web' ? ({ activeThumbColor: '#FFFFFF' } as object) : {}),
  };

  return (
    <Screen>
      <TabHeader label={`${roleLabel} · ${user?.name ?? ''}`} title="Ajustes" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32 }}>
        <Card style={s.profile}>
          <Avatar label={(user?.name ?? 'A').slice(0, 2).toUpperCase()} tint="purple" />
          <View style={{ flex: 1, gap: 3 }}>
            <Txt variant="bodyStrong">{user?.name}</Txt>
            <Txt variant="micro" color={colors.textMuted} numberOfLines={1}>
              {user?.email}
            </Txt>
          </View>
          <Chip label={roleLabel} />
        </Card>

        <Section title="Aparência">
          <Segmented<ThemeMode>
            options={[
              { value: 'system', label: 'Sistema' },
              { value: 'dark', label: 'Escuro' },
              { value: 'light', label: 'Claro' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </Section>

        <Section title="Limite de sessões por plano">
          <Card>
            {PLANS.map((plan, i) => (
              <View key={plan}>
                {i > 0 ? <Divider /> : null}
                <View style={s.row}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Txt variant="bodyStrong">{plan}</Txt>
                    <Txt variant="micro" color={colors.textMuted}>
                      sessões simultâneas
                    </Txt>
                  </View>
                  <View style={s.stepper}>
                    <Pressable
                      disabled={!canManage || planLimits[plan] <= 1}
                      onPress={() => setPlanLimit(plan, planLimits[plan] - 1)}
                      style={({ pressed }) => [s.stepBtn, (pressed || !canManage) && { opacity: 0.5 }]}>
                      <Minus size={15} color={colors.text} strokeWidth={1.8} />
                    </Pressable>
                    <Txt variant="bodyStrong" style={s.stepValue}>
                      {planLimits[plan]}
                    </Txt>
                    <Pressable
                      disabled={!canManage || planLimits[plan] >= 10}
                      onPress={() => setPlanLimit(plan, planLimits[plan] + 1)}
                      style={({ pressed }) => [s.stepBtn, (pressed || !canManage) && { opacity: 0.5 }]}>
                      <Plus size={15} color={colors.text} strokeWidth={1.8} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Notificações">
          <Card>
            <View style={s.row}>
              <View style={{ flex: 1, gap: 3 }}>
                <Txt variant="bodyStrong">Acesso simultâneo</Txt>
                <Txt variant="micro" color={colors.textMuted}>
                  push ao detectar
                </Txt>
              </View>
              <Switch value={notificationsOn} onValueChange={setNotificationsOn} {...switchColors} />
            </View>
            <Divider />
            <View style={s.row}>
              <View style={{ flex: 1, gap: 3 }}>
                <Txt variant="bodyStrong">Bloqueio automático</Txt>
                <Txt variant="micro" color={colors.textMuted}>
                  ao exceder o limite 3 vezes
                </Txt>
              </View>
              <Switch value={autoBlock} onValueChange={setAutoBlock} disabled={!canManage} {...switchColors} />
            </View>
          </Card>
        </Section>

        <Section title="Ajuda">
          <Card>
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              const Icon = open ? ChevronDown : ChevronRight;
              return (
                <View key={item.q}>
                  {i > 0 ? <Divider /> : null}
                  <Pressable onPress={() => setOpenFaq(open ? null : i)} style={s.row}>
                    <Txt variant="body" style={{ flex: 1 }}>
                      {item.q}
                    </Txt>
                    <Icon size={18} color={colors.textMuted} strokeWidth={1.8} />
                  </Pressable>
                  {open ? (
                    <Txt variant="caption" color={colors.textMuted} style={s.answer}>
                      {item.a}
                    </Txt>
                  ) : null}
                </View>
              );
            })}
          </Card>
        </Section>

        <Card style={{ marginTop: 26 }}>
          <Pressable onPress={signOut} style={s.row}>
            <Txt variant="bodyStrong" color={colors.dangerText} style={{ flex: 1 }}>
              Sair
            </Txt>
            <ChevronRight size={18} color={colors.dangerText} strokeWidth={1.8} />
          </Pressable>
        </Card>

        <Txt variant="micro" color={colors.textFaint} style={{ marginTop: 20, textAlign: 'center' }}>
          Beast Maragames · v0.1.0
        </Txt>
      </ScrollView>
    </Screen>
  );
}

const useStyles = makeStyles((c) => ({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  answer: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    marginTop: -4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    width: 30,
    textAlign: 'center',
  },
}));
