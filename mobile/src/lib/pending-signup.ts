// Credentials of an account that was just created and still has to confirm its email. Kept only in memory, never
// persisted: the verify-email screen uses them to sign in as soon as the confirmation link has been opened.
interface PendingSignup {
  email: string;
  password: string;
}

let pending: PendingSignup | null = null;

export const setPendingSignup = (value: PendingSignup) => {
  pending = value;
};
export const getPendingSignup = () => pending;
export const clearPendingSignup = () => {
  pending = null;
};
