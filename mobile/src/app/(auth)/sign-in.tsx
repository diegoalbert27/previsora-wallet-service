import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Checkbox } from '@/components/checkbox';
import { GoogleIcon } from '@/components/google-icon';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { setPendingSignup } from '@/lib/pending-signup';
import { supabase } from '@/lib/supabase';
import { signInWithGoogle } from '@/services/oauth';
import { colors, spacing } from '@/theme';

type Mode = 'sign-in' | 'sign-up';

const MAX_NAME_LENGTH = 50;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [credentialsInvalid, setCredentialsInvalid] = useState(false);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const signUp = mode === 'sign-up';

  function switchMode() {
    setMode(signUp ? 'sign-in' : 'sign-up');
    setFirstNameError(null);
    setLastNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setCredentialsInvalid(false);
    setConfirmPasswordError(null);
    setConfirmPassword('');
    setAcceptedTerms(false);
    setTermsError(null);
    setMessage(null);
  }

  async function continueWithGoogle() {
    setGoogleLoading(true);
    setMessage(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setMessage({ text: (e as Error).message, isError: true });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function submit() {
    const trimmed = email.trim();
    const emailProblem = EMAIL_PATTERN.test(trimmed) ? null : 'Enter a valid email.';
    const passwordProblem = password.length >= 6 ? null : 'Password must be at least 6 characters.';
    const first = firstName.trim();
    const last = lastName.trim();
    const nameProblem = (value: string) =>
      !signUp ? null : !value ? 'Required.' : value.length > MAX_NAME_LENGTH ? `At most ${MAX_NAME_LENGTH} characters.` : null;
    const firstNameProblem = nameProblem(first);
    const lastNameProblem = nameProblem(last);
    setFirstNameError(firstNameProblem);
    setLastNameError(lastNameProblem);
    setEmailError(emailProblem);
    setPasswordError(passwordProblem);
    const confirmProblem = signUp && !passwordProblem && confirmPassword !== password ? 'Passwords do not match.' : null;
    setConfirmPasswordError(confirmProblem);
    const termsProblem = signUp && !acceptedTerms ? 'You must accept the Terms and Conditions to continue.' : null;
    setTermsError(termsProblem);
    setMessage(null);
    setCredentialsInvalid(false);
    if (firstNameProblem || lastNameProblem || emailProblem || passwordProblem || confirmProblem || termsProblem) return;

    setLoading(true);
    const credentials = { email: trimmed, password };
    const { data, error } = signUp
      ? await supabase.auth.signUp({
          ...credentials,
          options: {
            data: { first_name: first, last_name: last, terms_accepted_at: new Date().toISOString() },
            emailRedirectTo: Linking.createURL('auth/callback'),
          },
        })
      : await supabase.auth.signInWithPassword(credentials);
    setLoading(false);

    if (error) {
      const badCredentials = !signUp && (error.code === 'invalid_credentials' || /invalid login credentials/i.test(error.message));
      setCredentialsInvalid(badCredentials);
      setMessage({ text: badCredentials ? 'Incorrect email or password.' : error.message, isError: true });
      return;
    }
    if (!signUp || data.session) return;

    setPendingSignup({ email: trimmed, password });
    router.replace('/verify-email');
  }

  return (
    <Screen>
      <Text style={styles.title}>Previsora Wallet</Text>
      <Text style={styles.subtitle}>{signUp ? 'Create your account' : 'Welcome back'}</Text>
      {signUp ? (
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <TextField
              label="First name"
              autoCapitalize="words"
              autoComplete="given-name"
              maxLength={MAX_NAME_LENGTH}
              value={firstName}
              onChangeText={setFirstName}
              error={firstNameError}
            />
          </View>
          <View style={styles.nameField}>
            <TextField
              label="Last name"
              autoCapitalize="words"
              autoComplete="family-name"
              maxLength={MAX_NAME_LENGTH}
              value={lastName}
              onChangeText={setLastName}
              error={lastNameError}
            />
          </View>
        </View>
      ) : null}
      <TextField
        label="Email"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setCredentialsInvalid(false);
        }}
        error={emailError}
        invalid={credentialsInvalid}
      />
      <TextField
        label="Password"
        secureTextEntry
        autoComplete={signUp ? 'new-password' : 'current-password'}
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          setCredentialsInvalid(false);
        }}
        error={passwordError}
        invalid={credentialsInvalid}
      />
      {signUp ? (
        <TextField
          label="Confirm password"
          secureTextEntry
          autoComplete="new-password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={confirmPasswordError}
        />
      ) : null}
      {signUp ? (
        <Checkbox
          checked={acceptedTerms}
          onChange={(value) => {
            setAcceptedTerms(value);
            if (value) setTermsError(null);
          }}
          error={termsError}>
          I accept the Terms and Conditions
        </Checkbox>
      ) : null}
      {message ? <Text style={message.isError ? styles.error : styles.info}>{message.text}</Text> : null}
      <Button title={signUp ? 'Create account' : 'Sign in'} onPress={submit} loading={loading} />
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      <Button
        title="Continue with Google"
        variant="light"
        icon={<GoogleIcon />}
        onPress={continueWithGoogle}
        loading={googleLoading}
      />
      <Button
        title={signUp ? 'I already have an account' : 'Create a new account'}
        variant="secondary"
        onPress={switchMode}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  nameRow: { flexDirection: 'row', gap: spacing.sm },
  nameField: { flex: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerLabel: { color: colors.textMuted, fontSize: 13 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: spacing.xl },
  subtitle: { fontSize: 16, color: colors.textMuted },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  info: { color: colors.text, fontSize: 14, textAlign: 'center' },
});
