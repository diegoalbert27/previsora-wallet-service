import { router } from 'expo-router';
import { UserHeader } from '@/components/ui/UserHeader';
import { useProfile } from '@/hooks/use-profile';
import { useAuth } from '@/providers/auth-provider';

/** "Welcome back" header with the signed-in user's avatar and name. Place it at the top of every tab; tapping it opens the profile. */
export function ProfileHeader() {
  const { session } = useAuth();
  const profile = useProfile();
  return (
    <UserHeader
      firstName={profile?.first_name}
      lastName={profile?.last_name}
      email={session?.user.email}
      onPress={() => router.push('/profile')}
    />
  );
}
