export const AuthMessages = {
  userOnly: 'Accès reservé aux clients',
  adminOnly: 'Accès reservé aux administrateurs',
  backOfficeOnly: "Accès reservé à l'équipe back-office",
  loginInvalid: 'Identifiants invalides',
  loginLimitReached: 'Limite de tentatives atteinte. Réessayez dans 15 minutes !',
  loginRemaining: (remaining: number, total: number) =>
    `Tentatives restantes: ${remaining} / ${total}.`,
  accessDeniedAuth: 'Accès refusé. Connectez-vous pour continuer.',
  accessDeniedRole: 'Accès refusé. Droits insuffisants.',
  serverError: 'Erreur serveur. Reéssayez plus tard.',
  genericError: 'Une erreur est survenue.',
  notFound: 'Page introuvable.',
} as const;
