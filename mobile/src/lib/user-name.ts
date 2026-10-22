interface NameParts {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  /** Fallback for accounts without a name (created before names were collected). */
  email: string | null | undefined;
}

export function displayName({ firstName, lastName, email }: NameParts): string {
  const full = [firstName, lastName].filter(Boolean).join(' ').trim();
  return full || email?.split('@')[0] || '';
}

export function initialsOf({ firstName, lastName, email }: NameParts): string {
  const fromName = [firstName, lastName].map((part) => part?.trim()[0]).filter(Boolean).join('');
  return (fromName || email?.trim()[0] || '?').toUpperCase();
}
