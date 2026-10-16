import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Field, gutter, Screen, Segmented, Txt } from '@/components/primitives';
import { useAuth, type Role } from '@/data/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function LoginScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('becker@beastmaragames.com');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('admin');
  const [error, setError] = useState('');

  const submit = () => {
    if (!email.trim() || !password) {
      setError('informe e-mail e senha');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('e-mail inválido');
      return;
    }
    setError('');
    signIn(email.trim().toLowerCase(), role);
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: gutter, paddingTop: 14 }}
          keyboardShouldPersistTaps="handled">
          <View style={{ gap: 6 }}>
            <Txt variant="label" color={colors.textMuted}>
              Beast Maragames
            </Txt>
            <Txt variant="title">Entrar</Txt>
            <Txt variant="small" color={colors.textMuted} style={{ marginTop: 2 }}>
              Monitor de acessos simultâneos
            </Txt>
          </View>

          <Txt variant="label" color={colors.textMuted} style={{ marginTop: 40, marginBottom: 12 }}>
            E-mail
          </Txt>
          <Field
            value={email}
            onChangeText={setEmail}
            placeholder="admin@beastmaragames.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
          />

          <Txt variant="label" color={colors.textMuted} style={{ marginTop: 24, marginBottom: 12 }}>
            Senha
          </Txt>
          <Field
            value={password}
            onChangeText={setPassword}
            placeholder="Sua senha"
            secureTextEntry
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />

          <Txt variant="label" color={colors.textMuted} style={{ marginTop: 24, marginBottom: 12 }}>
            Perfil
          </Txt>
          <Segmented<Role>
            options={[
              { value: 'admin', label: 'Administrador' },
              { value: 'suporte', label: 'Suporte' },
            ]}
            value={role}
            onChange={setRole}
          />

          {error ? (
            <Txt variant="mono" color={colors.dangerText} style={{ marginTop: 16 }}>
              {error}
            </Txt>
          ) : null}

          <View style={{ flex: 1, minHeight: 32 }} />
          <Button label="Entrar" onPress={submit} style={{ marginBottom: Math.max(insets.bottom, 12) + 4 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
