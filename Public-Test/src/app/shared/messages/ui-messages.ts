export const UiMessages = {
  auth: {
    accessDenied: 'Accès refusé. Connectez-vous pour continuer.',
    adminOnly: 'Accès refusé. Droits insuffisants.',
  },
  navigation: {
    notFound: 'Page introuvable.',
  },
  activity: {
    deleteConfirm: 'Voulez-vous vraiment supprimer cette activite ?',
    removeItemConfirm: 'Voulez-vous vraiment retirer cet element ?',
    created: (itemName: string) =>
      `Nouvelle activite creee avec ${itemName}.`,
    addedToActive: (itemName: string) =>
      `${itemName} ajoute a l activite active.`,
  },
  content: {
    invalidForm: 'Veuillez renseigner un nom et une valeur valides.',
    updated: (name: string) => `Element ${name} mis a jour.`,
    created: (name: string) => `Element ${name} cree.`,
    deleteConfirm: (name: string) => `Voulez-vous vraiment supprimer ${name} ?`,
    deleted: (name: string) => `Element ${name} supprime.`,
  },
  users: {
    deleteConfirm: (email: string) => `Supprimer ${email} ?`,
  },
} as const;
