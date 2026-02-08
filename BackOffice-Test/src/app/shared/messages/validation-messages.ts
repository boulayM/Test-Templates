export const ValidationMessages = {
  required: 'This field is required.',
  email: 'Invalid email format.',
  minLength: (n: number) => `Minimum ${n} characters.`,
  maxLength: (n: number) => `Maximum ${n} characters.`,
  passwordPolicy:
    'Password must contain at least 8 chars, 1 uppercase, 1 lowercase, 1 number, and 1 symbol.',
  invalidFormat: 'Invalid format.',
  conflictEmail: 'This email is already used.',
  numericExpected: 'Numeric value expected.',
  genericSubmit: 'The form contains errors. Please review your input.',
} as const;

