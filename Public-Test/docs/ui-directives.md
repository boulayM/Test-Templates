# UI Directives

## 1. Objet

Ce document decrit le cadrage front a fournir pour adapter un nouveau projet au socle `Public-Angular-Shell`.

Il complete :

- le playbook d adaptation ;
- le contrat API du projet ;
- les arbitrages de cadrage necessaires a l implementation du front.

## 2. Regles generales

- Domaine : [ex. e-commerce, education, service, institutionnel]
- Public cible : [visiteur, utilisateur connecte, client, etc.]
- Objectif principal du front : [ex. consultation, achat, reservation, suivi]
- Authentification requise : [oui/non, pour quelles pages]
- Contraintes particulieres : [SEO, captcha, verification email, etc.]

## 3. Parcours principaux

- Parcours 1 : [ex. consulter le catalogue]
- Parcours 2 : [ex. creer un compte]
- Parcours 3 : [ex. se connecter et gerer son panier]
- Parcours 4 : [ex. consulter son compte]

## 4. Cartographie des pages

Note :

- les pages systeme transverses du socle peuvent etre deja presentes avant tout cadrage metier ;
- cela inclut notamment les pages d erreur, de page introuvable et de refus d acces ;
- ces pages ne doivent etre redecrites dans le cadrage projet que si leur comportement ou leur contenu doit differer du standard du socle.

### Page

- Nom : [ex. Accueil]
- Archetype : [landing-page | list-page | detail-page | auth-page | account-page | checkout-page | history-page | system-page]
- Route : [ex. /home]
- Acteur(s) : [visiteur, utilisateur connecte]
- Objectif : [ce que cette page doit permettre]
- Donnees affichees : [liste explicite]
- Actions autorisees : [liste explicite]
- Endpoints utilises : [liste explicite]
- Regles d acces : [publique, auth requise, guest only, etc.]
- Liens sortants : [vers quelles pages]
- Etats UI a gerer : [loading, vide, erreur, succes, etc.]
- Arbitrages restants : [si aucun, ecrire "aucun"]

### Page

- Nom : [...]
- Archetype : [...]
- Route : [...]
- Acteur(s) : [...]
- Objectif : [...]
- Donnees affichees : [...]
- Actions autorisees : [...]
- Endpoints utilises : [...]
- Regles d acces : [...]
- Liens sortants : [...]
- Etats UI a gerer : [...]
- Arbitrages restants : [...]

## 5. Comportements transverses

- Navbar : [ce qu elle contient, pour quels acteurs]
- Footer : [present ou vide]
- Login : [page, modale, redirection, etc.]
- Register : [page dediee ou non]
- Verification email : [oui/non, parcours]
- Etats non authentifies : [redirection, message, blocage]
- SEO : [pages indexables / non indexables]
- Messages systeme importants : [si necessaire]

Pages systeme deja fournies par le socle :

- `/access-denied`
- `/forbidden`
- `/session-expired`
- `/service-unavailable`
- `/server-error`
- route `not-found` via la page de fallback

## 6. Points non couverts

- [liste des zones non tranchees]
- [liste des comportements explicitement hors perimetre]

## 7. Regle d utilisation

Ce document doit etre fourni a Codex en complement du playbook et du contrat API.

Le playbook ne remplace pas ce cadrage :

- il dit comment adapter ;
- il ne dit pas quelles pages precises le projet doit contenir.

Le contrat API ne remplace pas ce cadrage non plus :

- il dit ce qui est techniquement possible ;
- il ne dit pas ce qui doit etre affiche, ni ou, ni avec quelle priorite.

Aucune adaptation ne doit etre conduite sans un cadrage front minimal explicite.

## 8. Regles de normalisation UI (obligatoires)

### 8.1 Design system et composants

- Confirmer le DS cible avant adaptation : `Bootstrap` / `Tailwind` / `DS custom`.
- Utiliser en priorite les composants natifs du DS choisi (navbar, card, modal, carousel, forms, alerts).
- Interdire les composants custom si un equivalent DS existe, sauf justification explicite.

### 8.2 Grille et espacements

- Echelle d espacement : multiples de `8px` uniquement (`8, 16, 24, 32, 40, 48...`).
- Interdire les valeurs arbitraires (`73.2px`, `0.83rem`, etc.) pour `padding`, `margin`, `gap`.
- Definir une largeur de contenu coherente par breakpoint (container standard du DS).

### 8.3 Typographie

- Limiter a une hierarchie stable (`h1`, `h2`, `h3`, body, caption) avec tailles et `line-height` definies.
- Poids autorises : `400 / 500 / 600 / 700`.
- Interdire les tailles non standard non documentees.

### 8.4 Couleurs et contraste

- Utiliser uniquement les tokens couleur definis (primary, secondary, neutral, success, warning, danger).
- Contraste WCAG AA minimum : texte normal `>= 4.5:1`, gros texte `>= 3:1`.
- Interdire les couleurs "one-off" non tokenisees.

### 8.5 Icones et medias

- Un seul systeme d icones par projet (Bootstrap Icons ou autre), documente.
- Definir le format source des icones (font class, SVG inline, sprite SVG).
- Prevoir des placeholders systematiques pour images absentes ou erreurs.

### 8.6 Etats UI obligatoires

- Definir pour chaque page : `loading`, `empty`, `error`, `success`, `disabled`.
- Definir pour chaque action : feedback visuel (`pending / success / error`).

### 8.7 Responsive

- Breakpoints explicites (au minimum mobile / tablet / desktop).
- Navbar mobile : comportement burger defini.
- Regles de wrap/stack des zones critiques (navbar secondaire, footer, cards, CTA) definies.

### 8.8 Accessibilite

- Focus visible sur tous les elements interactifs.
- Labels et attributs ARIA pour formulaires, icones cliquables et boutons.
- Navigation clavier complete sur les composants interactifs.

### 8.9 Qualite d implementation

- Pas de style inline (sauf exception documentee).
- Pas de duplication de styles entre composants.
- Verification finale obligatoire : cohérence spacing, typographie, couleurs, responsive, accessibilite.
