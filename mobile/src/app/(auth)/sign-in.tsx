import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/theme';

type Mode = 'sign-in' | 'sign-up';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const signUp = mode === 'sign-up';

  function switchMode() {
    setMode(signUp ? 'sign-in' : 'sign-up');
    setEmailError(null);
    setPasswordError(null);
    setMessage(null);
  }

  async function submit() {
    const trimmed = email.trim();
    const emailProblem = EMAIL_PATTERN.test(trimmed) ? null : 'Enter a valid email.';
    const passwordProblem = password.length >= 6 ? null : 'Password must be at least 6 characters.';
    setEmailError(emailProblem);
    setPasswordError(passwordProblem);
    setMessage(null);
    if (emailProblem || passwordProblem) return;

    setLoading(true);
    const credentials = { email: trimmed, password };
    const { data, error } = signUp
      ? await supabase.auth.signUp(credentials)
      : await supabase.auth.signInWithPassword(credentials);
    setLoading(false);

    if (error) setMessage({ text: error.message, isError: true });
    // With "Confirm email" enabled in Supabase, sign-up succeeds without a session.
    else if (signUp && !data.session) setMessage({ text: 'Check your email to confirm your account.', isError: false });
  }

  return (
    <Screen>
      <Text style={styles.title}>Previsora Wallet</Text>
      <Text style={styles.subtitle}>{signUp ? 'Create your account' : 'Welcome back'}</Text>
      <TextField
        label="Email"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        error={emailError}
      />
      <TextField
        label="Password"
        secureTextEntry
        autoComplete={signUp ? 'new-password' : 'current-password'}
        value={password}
        onChangeText={setPassword}
        error={passwordError}
      />
      {message ? <Text style={message.isError ? styles.error : styles.info}>{message.text}</Text> : null}
      <Button title={signUp ? 'Create account' : 'Sign in'} onPress={submit} loading={loading} />
      <Button
        title={signUp ? 'I already have an account' : 'Create a new account'}
        variant="secondary"
        onPress={switchMode}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: spacing.xl },
  subtitle: { fontSize: 16, color: colors.textMuted },
  error: { color: colors.danger, fontSize: 14 },
  info: { color: colors.text, fontSize: 14 },
});
