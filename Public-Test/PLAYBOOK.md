# Playbook d adaptation Front Public au socle

## 0. Objectif

Adapter un projet concret au socle Public Angular en garantissant :

- alignement strict au contrat API,
- concretisation metier propre (selon le domaine cible),
- mutualisation technique/UI maximale,
- securite front et stabilite,
- qualite continue + SEO integre pendant la migration.

---

## 1. Perimetre

Ce playbook couvre le **Front Public** :

- pages ouvertes (home/liste/detail/contenu),
- auth (login/register/verify),
- espace utilisateur protege.

---

## 2. Pre requis

- API cible disponible (dev/e2e).
- Contrat API exploitable (Swagger/Postman + regles metier).
- Jeu de comptes de test (guest + user).
- Seed coherent (dev visuel, e2e automatisation).
- Branche dediee.

---

## 3. Principes directeurs (obligatoires)

### 3.1 Contrat API d abord

- Chaque ecran est aligne sur des endpoints reels.
- Query/body respectent strictement les schemas API.
- Les codes d erreur sont traites selon le contrat reel.

### 3.2 Anti mock / anti placeholder

- Interdits en adaptation finale :
  - retours simules (`of([...])`),
  - placeholders fonctionnels (`NotImplemented`, `TODO`),
  - fallbacks silencieux qui cachent une erreur backend.
- Toute vue doit afficher soit donnees reelles, soit etat explicite (`loading`, `empty`, `error`).

### 3.3 Regle socle vs regle adaptation

- **Socle** : garder un vocabulaire abstrait et reusable (`content`, `activity`).
- **Projet adapte** : concretiser librement selon le domaine/API cible (catalogue, services, dossiers, etc.).
- Ne pas confondre contrainte du socle et contrainte projet.

### 3.4 Mutualisation maximale

- Logique transversale dans `core/*`.
- Composants/etats communs dans `shared/*`.
- Aucune duplication de patterns UI recurrents (page shell, toolbar, data states, feedback).

### 3.5 Securite front

- Auth cookie HttpOnly + CSRF via API.
- `guestGuard` pour login/register.
- `authGuard` pour routes protegees avec redirection `/login?redirect=...`.
- `roleGuard` uniquement si le projet public le requiert.

### 3.6 Securite DOM / XSS

Interdits :
- `innerHTML` / `[innerHTML]`,
- `DomSanitizer.bypassSecurityTrust*`,
- `eval`, `new Function`, `document.write`, `insertAdjacentHTML`,
- URLs `javascript:`.

Gate obligatoire :
- `npm run check:dom-xss`.

---

## 4. Charte graphique et Design System (obligatoire)

### 4.1 Tokens

Definir/utiliser des tokens pour :
- couleurs (brand, surfaces, semantic states),
- typographie,
- spacing/radius/shadow,
- breakpoints.

### 4.2 Regles DS

- Pas de styles inline en adaptation finale.
- Pas de composant visuel hors DS sans justification.
- Etats normalises : `default`, `hover`, `focus`, `disabled`, `error`, `loading`.
- Accessibilite minimale : contraste, focus visible, labels/form controls coherents.

### 4.3 Theming

- Le theme de marque se fait par tokens (pas par duplication massive de composants).

---

## 5. SEO pendant la migration (obligatoire)

### 5.1 SEO technique par page publique

- `title` unique,
- `meta description`,
- canonical,
- robots (index/noindex selon cas).

### 5.2 SEO social

- Open Graph (`og:title`, `og:description`, `og:image`, `og:url`),
- Twitter cards minimales.

### 5.3 Donnees structurees

- JSON-LD seulement si pertinent au domaine adapte.
- Eviter schemas generiques faux.

### 5.4 Performance SEO

- verifier LCP/CLS/INP,
- optimiser images et poids JS sur pages publiques critiques.

### 5.5 Validation SEO

- checklist Lighthouse/DevTools,
- verification preview social/indexabilite.

---

## 6. Phases d adaptation (ordre recommande)

### 6.1 Phase 1 - Scan et cadrage

1. Scanner socle front (routes, guards, services, DS).
2. Scanner contrat API cible.
3. Construire matrice : ecran <-> endpoint <-> test.

### 6.2 Phase 2 - Mapping concret API

1. Mapper services front abstraits vers endpoints concrets du projet.
2. Aligner DTOs/mappers.
3. Verifier erreurs et statuts.

### 6.3 Phase 3 - Navigation, guards, UX erreurs

1. Verifier routes publiques/protegees.
2. Verifier URL directe sans session (jamais page blanche).
3. Verifier redirections post-login/logout.

### 6.4 Phase 4 - DS + charte graphique

1. Poser tokens de marque.
2. Harmoniser composants critiques (header, formulaires, feedback).
3. Verifier responsive mobile/desktop.

### 6.5 Phase 5 - SEO

1. Injecter metadata page par page.
2. Ajouter OG/Twitter.
3. Ajouter JSON-LD pertinent.
4. Verifier perf/indexabilite.

### 6.6 Phase 6 - Tests et stabilisation

1. Unit tests services/guards/mappers.
2. E2E smoke + auth + routes protegees + cas SEO critiques.
3. Stabiliser selectors/assertions.

---

## 7. Checklists

### 7.1 Checklist adaptation

- [ ] Matrice ecrans/endpoints/tests complete.
- [ ] Aucun mock/placeholder restant.
- [ ] Mapping API concret valide.
- [ ] Guards/redirections OK (pas de page blanche).
- [ ] Mutualisation respectee (`core/*`, `shared/*`).
- [ ] `check:dom-xss` passe.

### 7.2 Checklist SEO

- [ ] title/meta/canonical/robots sur pages publiques.
- [ ] OG/Twitter en place.
- [ ] JSON-LD coherent (si utilise).
- [ ] Lighthouse/DevTools verifies.

### 7.3 Checklist release

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:unit`
- [ ] `npm run e2e`
- [ ] README + playbook synchronises.

---

## 8. Versionning recommande

1. Branche par macro-etape.
2. Commits atomiques par lot coherent.
3. Validation complete avant merge final.

---

## 9. Livrables minimaux

- code front adapte,
- tests a jour (unit + e2e),
- evidence de validation SEO,
- documentation synchronisee.
