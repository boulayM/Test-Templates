export const ValidationMessages = {
  required: 'Ce champ est obligatoire.',
  email: 'Format d email invalide.',
  minLength: (n: number) => `Minimum ${n} caracteres.`,
  maxLength: (n: number) => `Maximum ${n} caracteres.`,
  passwordPolicy:
    'Le mot de passe doit contenir au moins 8 caracteres, une majuscule, une minuscule, un chiffre et un symbole.',
  invalidFormat: 'Format invalide.',
  conflictEmail: 'Cet email est deja utilise.',
  genericSubmit: 'Le formulaire contient des erreurs. Verifiez vos saisies.',
} as const;
