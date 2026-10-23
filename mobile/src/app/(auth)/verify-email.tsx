import { Redirect, router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { clearPendingSignup, getPendingSignup } from '@/lib/pending-signup';
import { supabase } from '@/lib/supabase';
import { theme } from '@/theme';

const POLL_INTERVAL_MS = 15_000;
const RESEND_COOLDOWN_S = 30;

export default function VerifyEmailScreen() {
  const pending = getPendingSignup();
  const checking = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);

  const check = useCallback(async () => {
    if (!pending || checking.current) return;
    checking.current = true;
    const { error: signInError } = await supabase.auth.signInWithPassword(pending);
    checking.current = false;

    if (!signInError) {
      clearPendingSignup();
      return;
    }
    const stillWaiting =
      signInError.code === 'email_not_confirmed' ||
      signInError.code === 'invalid_credentials' ||
      /not confirmed|invalid login credentials/i.test(signInError.message);
    if (!stillWaiting) setError(signInError.message);
  }, [pending]);

  useEffect(() => {
    const interval = setInterval(check, POLL_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && check());
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [check]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timeout = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timeout);
  }, [cooldown]);

  if (!pending) return <Redirect href="/sign-in" />;

  async function resend() {
    if (!pending) return;
    setResending(true);
    setError(null);
    setNotice(null);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: pending.email,
      options: { emailRedirectTo: Linking.createURL('auth/callback') },
    });
    setResending(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setNotice('We sent you a new email.');
    setCooldown(RESEND_COOLDOWN_S);
  }

  function changeEmail() {
    clearPendingSignup();
    router.replace('/sign-in');
  }

  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.iconBox}>
          <Mail size={40} color={theme.colors.brand.lime} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.body}>
          We sent a confirmation link to <Text style={styles.email}>{pending.email}</Text>. Open it to activate your
          account and we will sign you in automatically.
        </Text>

        <View style={styles.waiting}>
          <ActivityIndicator size="small" color={theme.colors.text.secondary} />
          <Text style={styles.waitingLabel}>Waiting for confirmation…</Text>
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <Button
        title={cooldown > 0 ? `Resend email (${cooldown}s)` : 'Resend email'}
        variant="secondary"
        onPress={resend}
        loading={resending}
        disabled={cooldown > 0}
      />
      <Button title="Use a different email" variant="secondary" onPress={changeEmail} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.space[4] },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.bg.surface1,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...theme.typography.displayAmount, fontSize: 28, lineHeight: 34, color: theme.colors.text.primary },
  body: { ...theme.typography.body, color: theme.colors.text.secondary, textAlign: 'center' },
  email: { fontFamily: theme.typography.bodyStrong.fontFamily, color: theme.colors.text.primary },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2], marginTop: theme.space[2] },
  waitingLabel: { ...theme.typography.bodySecondary, color: theme.colors.text.secondary },
  notice: { ...theme.typography.bodySecondary, color: theme.colors.status.success },
  error: { ...theme.typography.bodySecondary, color: theme.colors.status.error, textAlign: 'center' },
});
