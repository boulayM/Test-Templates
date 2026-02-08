export const ValidationMessages = {
  required: 'This field is required.',
  email: 'Invalid email format.',
  minLength: (n: number) => `Minimum ${n} characters.`,
  maxLength: (n: number) => `Maximum ${n} characters.`,
  passwordWeak: 'Password does not meet security requirements.',
  invalidFormat: 'Invalid format.',
  numericExpected: 'A numeric value is expected.',
  genericSubmit: 'The form contains errors. Please review your input.',
} as const;

