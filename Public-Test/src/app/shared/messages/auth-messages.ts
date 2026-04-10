export const AuthMessages = {
  userOnly: 'Acces reserve aux clients',
  adminOnly: 'Acces reserve aux administrateurs',
  loginInvalid: 'Identifiants invalides',
  loginLimitReached: 'Limite de tentatives atteinte. Réessayez dans 15 minutes !',
  loginRemaining: (remaining: number, total: number) =>
    `Tentatives restantes: ${remaining} / ${total}.`,
  accessDeniedAuth: 'Acces refuse. Connectez-vous pour continuer.',
  accessDeniedRole: 'Acces refuse. Droits insuffisants.',
  sessionExpired: 'Votre session a expire. Reconnectez-vous pour continuer.',
  serverError: 'Erreur serveur. Reessayez plus tard.',
  serviceUnavailable: 'Service temporairement indisponible. Reessayez plus tard.',
  genericError: 'Une erreur est survenue.',
  notFound: 'Page introuvable.',
} as const;
