export const AuthMessages = {
  userOnly: 'Accès réservé aux clients',
  adminOnly: 'Accès réservé aux administrateurs',
  loginInvalid: 'Identifiants invalides',
  loginLimitReached:
    'Limite de tentatives atteinte. Réessayez dans 15 minutes !',
  loginRemaining: (remaining: number, total: number) =>
    `Tentatives restantes: ${remaining} / ${total}.`,
  accessDeniedAuth: 'Accès refusé. Connectez-vous pour continuer.',
  accessDeniedRole: 'Accès refusé. Droits insuffisants.',
  serverError: 'Erreur serveur. Réessayez plus tard.',
  genericError: 'Une erreur est survenue.',
  notFound: 'Page introuvable.',
} as const;
