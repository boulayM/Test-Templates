export const AuthMessages = {
  userOnly: 'Acces reserve aux clients',
  adminOnly: 'Acces reserve aux administrateurs',
  backOfficeOnly: 'Acces reserve a l equipe back-office',
  loginInvalid: 'Identifiants invalides',
  loginLimitReached: 'Limite de tentatives atteinte. Réessayez dans 15 minutes !',
  loginRemaining: (remaining: number, total: number) =>
    `Tentatives restantes: ${remaining} / ${total}.`,
  accessDeniedAuth: 'Acces refuse. Connectez-vous pour continuer.',
  accessDeniedRole: 'Acces refuse. Droits insuffisants.',
  serverError: 'Erreur serveur. Reessayez plus tard.',
  genericError: 'Une erreur est survenue.',
  notFound: 'Page introuvable.',
} as const;
