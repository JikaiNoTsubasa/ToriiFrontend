/** Strength level of a password, from 0 (empty / very weak) to 4 (strong). */
export type PasswordScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  score: PasswordScore;
  label: string;
  /** What would make the password stronger (empty when strong). */
  hints: string[];
}

const LABELS: Record<PasswordScore, string> = {
  0: 'Too weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
};

/**
 * Rough password strength for the UI meter: length first (8 minimum, 12+ preferred), then
 * character variety. Guidance only — the API enforces the 8-character minimum.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: LABELS[0], hints: ['Use at least 8 characters.'] };
  }

  const hints: string[] = [];
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;

  if (password.length < 8) hints.push('Use at least 8 characters.');
  else if (password.length < 12) hints.push('12 characters or more is better.');
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) hints.push('Mix upper and lower case letters.');
  if (!/\d/.test(password)) hints.push('Add a number.');
  if (!/[^A-Za-z0-9]/.test(password)) hints.push('Add a symbol.');

  let score: number;
  if (password.length < 8) score = variety >= 3 ? 1 : 0;
  else score = Math.min(4, (password.length >= 12 ? 2 : 1) + Math.max(0, variety - 2));

  return { score: score as PasswordScore, label: LABELS[score as PasswordScore], hints };
}
