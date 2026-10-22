import { Redirect } from 'expo-router';

// Android can also hand the OAuth redirect (previsora://auth/callback) to the app as a deep link. The session is
// created in services/oauth.ts, so this route only has to land somewhere valid instead of "Unmatched Route".
export default function AuthCallback() {
  return <Redirect href="/" />;
}
