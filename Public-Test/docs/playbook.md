# Playbook d adaptation Front Public au socle

## 0. Fonction du document

Ce document fixe les directives que Codex doit suivre pour adapter un nouveau projet au socle Front Public.

Il sert a :

- cadrer l analyse du besoin ;
- guider la derivation du front a partir du besoin et du contrat API ;
- imposer les contraintes du socle pendant l adaptation ;
- fixer les conditions minimales de generation, d implementation et de validation ;
- encadrer la boucle entre generation initiale, prototypage et consolidation.

Ce document n est pas une documentation produit. C est un document d encadrement pour une adaptation assistee.

Regle d usage :

- Codex doit suivre ce playbook par defaut pendant toute adaptation au socle ;
- Codex ne doit s en ecarter que si le projet cible impose explicitement une contrainte contraire ;
- en cas d ecart, Codex doit le signaler comme arbitrage ou comme exception de projet.

---

## 1. Objectif

Adapter un projet concret au socle Public Angular en garantissant :

- alignement strict au contrat API ;
- concretisation metier propre au domaine cible ;
- mutualisation technique et UI maximale ;
- securite front et stabilite ;
- qualite continue et SEO integre pendant l adaptation ;
- production d une interface de demarrage exploitable, navigable et testable.

Codex doit privilegier une adaptation assistee fondee sur le besoin, le contrat API et les conventions du socle, et non sur des choix UI improvises.

---

## 2. Perimetre et pre requis

### 2.1 Perimetre

Ce playbook couvre le Front Public :

- pages ouvertes ;
- parcours d authentification ;
- espace utilisateur protege ;
- pages systeme transverses si necessaire.

### 2.2 Pre requis

Avant toute adaptation :

- API cible disponible ;
- contrat API exploitable ;
- regles metier suffisamment explicites ;
- comptes et donnees de test disponibles ;
- seed coherent pour usage visuel et automatisation ;
- branche dediee ;
- environnement e2e prepare.

L API doit etre demarree avant toute execution `npm run e2e` du front.

Si un pre requis manque, Codex doit le signaler avant de presenter l adaptation comme executable ou validable.

---

## 3. Principes d adaptation

### 3.1 Principe general

Le front public est derive du besoin metier et du contrat API, pas d une intuition d interface.

Codex doit produire une adaptation assistee :

- en derivant automatiquement ce qui est explicitement deducible ;
- en listant les arbitrages structurants qui ne peuvent pas etre inferes proprement ;
- en ne demandant une clarification que pour les points bloquants.

Codex doit privilegier l execution a partir des informations disponibles. Il ne doit pas interrompre l adaptation pour des questions non bloquantes.

### 3.2 Ce que Codex doit faire

Codex doit :

- identifier les acteurs ;
- identifier les ressources metier exposees ;
- identifier les parcours ;
- deriver les ecrans necessaires ;
- rattacher chaque ecran a un archetype ;
- associer chaque ecran a ses endpoints, regles d acces, donnees et actions ;
- remapper la terminologie du socle vers la terminologie metier ;
- produire un registre explicite des arbitrages structurants ;
- preparer une specification minimale exploitable pour generation ou implementation.

Sorties minimales attendues :

- une cartographie du front a produire ;
- une liste explicite des dependances API ;
- un registre d arbitrages ;
- une base suffisante pour generer ou implementer sans improvisation structurelle.

### 3.3 Ce que Codex ne doit pas faire

Codex ne doit pas :

- inventer silencieusement des pages ou flux structurants ;
- supposer une hierarchie visuelle finale ;
- supposer un wording metier final sans base explicite ;
- inventer une strategie SEO fine sans arbitrage ;
- laisser des termes de socle visibles sans justification ;
- generer des vues qui ne correspondent a aucun acteur, objectif ou flux identifies.

Si une decision reste incertaine mais non bloquante, Codex doit :

- appliquer le comportement par defaut du socle ;
- tracer l hypothese dans le registre d arbitrages ;
- poursuivre l adaptation.

---

## 4. Analyse du besoin et cadrage

### 4.1 Sortie attendue de l analyse

L analyse doit produire au minimum :

- cartographie des pages ;
- cartographie des parcours ;
- mapping acteur -> ecran -> action ;
- mapping ecran -> endpoint -> regle d acces ;
- liste des arbitrages restants ;
- specification minimale exploitable pour la suite.

Si ces sorties ne peuvent pas etre produites, Codex doit considerer que le cadrage est incomplet.

### 4.2 Etapes d analyse

1. Identifier les acteurs :
   - public ;
   - authentifie ;
   - conditionnel selon role ou contexte.
2. Identifier les ressources metier exposees :
   - consultation ;
   - modification ;
   - relations visibles dans la navigation ou l affichage.
3. Identifier les parcours :
   - decouverte ;
   - consultation ;
   - authentification ;
   - usage authentifie ;
   - conversion ou action principale.
4. Deriver les ecrans :
   - liste ;
   - detail ;
   - formulaire ;
   - confirmation ;
   - historique, suivi ou page systeme si necessaire.
5. Associer les dependances API :
   - endpoints par ecran ;
   - actions UI -> operations backend ;
   - etats `loading`, `empty`, `error`, `forbidden`, `success`.
6. Associer les regles d acces :
   - public ;
   - authentifie ;
   - conditionnel ;
   - redirections et garde-fous.
7. Lister les points a arbitrer :
   - navigation ;
   - densite ;
   - tri, filtres, pagination ;
   - responsive ;
   - statut SEO ;
   - niveau de detail des vues.

### 4.3 Terminologie projet

La terminologie du socle doit etre remappee vers la terminologie metier du projet.

Aucun terme de socle non justifie ne doit rester visible dans :

- routes ;
- composants ;
- services ;
- labels et messages UI ;
- tests ;
- documentation.

Avant implementation detaillee, produire un mapping minimal :

- terme du besoin ;
- terme retenu ;
- zone d usage ;
- ecarts volontaires et justification.

### 4.4 Registre d arbitrages

Codex doit produire un registre explicite des arbitrages front quand ils ne sont pas fixes par le besoin.

Le registre doit couvrir au minimum :

- structure des pages et routes ;
- navigation principale et secondaire ;
- acces et redirections ;
- donnees affichees ;
- actions principales et secondaires ;
- etats UI ;
- terminologie visible ;
- densite, tri, filtres, pagination ;
- statut SEO/indexable des pages publiques.

Chaque arbitrage doit etre marque :

- `decide` ;
- `a valider` ;
- `reporte`.

Le registre n est pas optionnel lorsqu un point structurant n est pas explicitement fixe par le besoin.

### 4.5 Arbitrages bloquants

Codex doit demander une clarification si un arbitrage modifie :

- l existence d une page ;
- son archetype ;
- son acces ou sa visibilite ;
- son contenu principal ;
- ses actions principales ;
- son role dans un flux ;
- son statut indexable ;
- la structure des pages d entree publiques.

Les arbitrages non bloquants peuvent etre :

- derives selon les gabarits du socle ;
- laisses dans le registre avec statut `a valider` ;
- ajustes ensuite dans la boucle de prototypage.

Regle de decision :

- si l arbitrage modifie la structure, l acces, le sens metier ou l indexabilite d une page, Codex doit le traiter comme bloquant ;
- sinon, Codex doit continuer en s appuyant sur les standards du socle.

---

## 5. Specification minimale pour generation

### 5.1 Archetypes supportes

Chaque ecran doit etre rattache a un archetype avant generation ou implementation.

Archetypes minimaux :

- `landing-page`
- `list-page`
- `detail-page`
- `auth-page`
- `account-page`
- `checkout-page`
- `history-page`
- `system-page`

### 5.2 Structure minimale generable

Par defaut, le socle doit pouvoir produire :

- une page d entree publique ;
- une navigation principale claire ;
- une ou plusieurs pages de liste et de detail ;
- des pages d authentification ;
- un espace utilisateur protege si le domaine l exige ;
- des pages systeme transverses si necessaire.

Pages systeme du socle :

- les pages d erreur et de refus d acces peuvent etre implantees directement dans le socle ;
- elles ne dependent pas du domaine metier et n ont pas a etre redefinies a chaque adaptation ;
- le cadrage projet ne doit les completer que si un besoin specifique impose un message ou un comportement particulier.

Clarification :

- la `landing-page` n est pas, par defaut, une page d exposition de donnees metier ;
- l exposition d une liste de produits, contenus, ressources ou enregistrements releve d un archetype `list-page` explicitement demande ;
- aucune liste metier ne doit etre placee sur la page d entree publique sans directive explicite dans le cadrage d adaptation.

### 5.3 Entrees minimales

Aucune page ne doit etre generee sans entrees explicites.

Pour chaque page ou ressource, fournir au minimum :

- nom metier ;
- archetype ;
- acteur(s) concerne(s) ;
- route cible ;
- objectif principal ;
- endpoint(s) utilises ;
- regles d acces ;
- donnees affichees ;
- actions autorisees ;
- etats UI a gerer ;
- points d arbitrage restants ;
- statut SEO/indexable si la page est publique.

Complements selon le cas :

- filtres ;
- tri ;
- pagination ;
- champs de formulaire ;
- blocs de recapitulatif ;
- CTA principaux ;
- metadata SEO et balisage structure.

Si une ou plusieurs entrees critiques manquent, Codex ne doit ni generer silencieusement la page ni inventer sa structure finale.

### 5.4 Definition of ready

Une page ou un module n est generable que si :

- son archetype est identifie ;
- son objectif metier est clair ;
- ses acteurs sont connus ;
- ses endpoints sont identifies ;
- ses regles d acces sont explicites ;
- ses donnees et actions sont definies ;
- ses arbitrages critiques sont traites ou isoles ;
- sa terminologie metier est validee ;
- son statut SEO/indexable est precise si la page est publique.

Si ces conditions ne sont pas remplies, Codex doit :

- revenir au cadrage ;
- completer le registre d arbitrages ;
- ou demander une clarification si le blocage est structurant.

---

## 6. Regles du socle et contraintes d implementation

### 6.1 Contrat API d abord

- Chaque ecran est aligne sur des endpoints reels.
- Query et body respectent strictement les schemas API.
- Les codes d erreur sont traites selon le contrat reel.

Codex ne doit pas concevoir une interaction UI qui n a pas de support contractuel cote API, sauf si cette interaction est explicitement marquee comme future ou hors perimetre.

### 6.2 Anti mock / anti placeholder

Interdits en adaptation finale :

- retours simules ;
- placeholders fonctionnels ;
- fallbacks silencieux qui masquent une erreur backend.

Chaque vue doit afficher :

- donnees reelles ;
- ou un etat explicite (`loading`, `empty`, `error`, `forbidden`).

Tout placeholder ou comportement de simulation conserve apres adaptation doit etre considere comme un ecart a resoudre avant validation.

### 6.3 Mutualisation maximale

- logique transversale dans `core/*` ;
- composants et etats communs dans `shared/*` ;
- aucune duplication de patterns UI recurrents ;
- etat UI local prefere en Angular Signals ;
- formulaires critiques en Reactive Forms types.

Codex doit preferer l extension du socle existant a la creation de variantes locales equivalentes.

### 6.4 Stack UI cible

- base UI : `ng-bootstrap` + Bootstrap SCSS minimal ;
- importer uniquement les modules Bootstrap utiles ;
- centraliser les tokens neutres ;
- interdire l import Bootstrap complet et les DS paralleles.

Toute sortie de la stack cible doit etre justifiee par une contrainte projet explicite.

### 6.4.1 Confirmation DS obligatoire avant adaptation

Avant toute implementation UI, Codex doit obtenir (ou retrouver dans les directives projet) une confirmation explicite du Design System cible parmi :

- Bootstrap (classes + composants natifs / `ng-bootstrap`) ;
- Tailwind (utility first + composants projet) ;
- Design System custom (tokens + composants internes).

Regles :

- en l absence de confirmation explicite, Codex ne doit pas arbitrer seul ; il doit demander une confirmation du DS ;
- une fois le DS confirme, Codex doit prioriser les composants natifs du DS (modal, carousel, dropdown, etc.) avant toute implementation custom ;
- toute derogation (composant custom a la place d un composant natif du DS) doit etre tracee dans le registre d arbitrages avec justification technique.

### 6.5 Ressources Angular a exploiter

- `title` renseigne sur chaque page cle ;
- metadata SEO pilotee par `data` de route avec service centralise ;
- initialisation transverse via `APP_INITIALIZER` ;
- `provideZoneChangeDetection` active.

### 6.6 Securite front

- auth par cookie HttpOnly + CSRF via API ;
- `guestGuard` pour login/register ;
- `authGuard` pour routes protegees avec redirection ;
- `roleGuard` uniquement si le projet le requiert.

### 6.7 Securite DOM / XSS

Interdits :

- `innerHTML` et `[innerHTML]` ;
- `DomSanitizer.bypassSecurityTrust*` ;
- `eval`, `new Function`, `document.write`, `insertAdjacentHTML` ;
- URLs `javascript:`.

Gate obligatoire :

- `npm run check:dom-xss`

Codex ne doit pas introduire de contournement de ce gate.

### 6.8 Scripts et portabilite

- scripts npm portables Windows/Linux/macOS ;
- checks executes via Node quand possible ;
- variables e2e injectees via `cross-env`.

---

## 7. Interface de generation neutre

La generation doit produire une interface de demarrage exploitable, pas une interface finale figee.

Principes :

- palette neutre noir / blanc / gris ;
- composants Bootstrap utilises de maniere minimale ;
- cartes simples ;
- bordures sobres ;
- boutons prioritairement en `outline` neutre ;
- usage de la couleur limite au signal fonctionnel indispensable ;
- pas d habillage de marque ;
- pas de direction graphique specifique imposee pendant la generation.

Regles :

- pas de styles inline en adaptation finale ;
- pas de composant visuel hors stack sans justification ;
- accessibilite minimale respectee ;
- etats UI normalises : `default`, `hover`, `focus`, `disabled`, `error`, `loading`.

Cette interface doit rester :

- lisible ;
- navigable ;
- testable ;

### 7.1 Contrat auth de reference

Pour les socles `Public-Angular-Shell` et `Api-Express-Shell`, le contrat canonique d authentification est :

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/verify-email`
- `GET /auth/me`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/refresh`

Regles :

- l utilisateur courant authentifie doit etre recupere via `auth/me` ;
- `users/me` ne doit pas etre utilise comme contrat de reference du front public ;
- toute adaptation du front a un projet derive doit verifier l alignement de ces endpoints avant implementation.
- exploitable immediatement.

Codex doit traiter cette neutralite comme une contrainte de generation, pas comme une faiblesse de conception.

---

## 8. SEO et indexabilite

Le SEO doit etre derive pendant l adaptation, pas traite apres coup.

Pour chaque page ou famille de pages publiques, expliciter :

- si la page doit etre indexee, non indexee ou canonisee ;
- son objectif principal ;
- le slug ou chemin public attendu ;
- le `title`, la `meta description` et le `canonical` attendus ;
- les besoins en Open Graph, Twitter cards et JSON-LD ;
- les risques de duplication.

Regles minimales :

- `title` unique ;
- `meta description` ;
- `canonical` ;
- `robots` coherent ;
- `noindex,nofollow` sur auth/account si approprie ;
- JSON-LD uniquement si pertinent ;
- pas de schema structure faux.

Validations minimales :

- checklist Lighthouse/DevTools ;
- verification indexabilite ;
- verification preview social ;
- gates SEO du projet si definies.

Si le statut SEO d une page publique reste incertain, Codex doit l enregistrer comme arbitrage structurant.

---

## 9. Phases d adaptation

### 9.1 Phase 1 - Scan et cadrage

1. Scanner le socle front.
2. Scanner le contrat API cible.
3. Construire la matrice ecran <-> endpoint <-> test.
4. Verifier les scripts de setup e2e.
5. Verifier la reachability API avant tests.

Sortie attendue :

- constat de phase ;
- perimetre derive ;
- points de blocage identifies.

### 9.2 Phase 2 - Mapping concret API

1. Mapper les services abstraits vers les endpoints reels.
2. Aligner DTOs et mappers.
3. Verifier erreurs et statuts.

Sortie attendue :

- mapping front/API exploitable sans ambiguite.

### 9.3 Phase 3 - Navigation, guards, UX erreurs

1. Verifier routes publiques et protegees.
2. Verifier l acces direct sans session.
3. Verifier redirections login/logout.

Sortie attendue :

- navigation fonctionnelle et defenses d acces coherentes.

### 9.4 Phase 4 - Generation UI de demarrage

1. Generer une interface de demarrage sobre, navigable et testable.
2. Utiliser la stack UI cible du socle.
3. Verifier responsive mobile et desktop.

Sortie attendue :

- premiere interface exploitable sans dependre d une direction graphique finale.

### 9.5 Phase 5 - Prototype, affinage et SEO

1. Consolider les arbitrages dans un prototype ou une maquette.
2. Affiner structure, lisibilite et hierarchie visuelle.
3. Integrer metadata et logique SEO.
4. Verifier performance et indexabilite.

Sortie attendue :

- decisions consolidees et reinjectables dans l interface.

### 9.6 Phase 6 - Tests et stabilisation

1. Unit tests services, guards, mappers.
2. E2E smoke, auth, routes protegees et cas critiques.
3. Stabiliser selectors et assertions.
4. Executer e2e uniquement si l API est prete.

Sortie attendue :

- adaptation verifiable ;
- preuves exploitables ;
- base stable pour livraison.

---

## 10. Boucle de prototypage

Le prototype n est pas necessairement la source initiale de l interface.

Le processus vise est :

- besoin ;
- derivation fonctionnelle ;
- arbitrages ;
- generation initiale de l interface ;
- prototypage et ajustements ;
- reinjection des decisions dans l interface.

La generation produit donc une base de depart.
Le prototype sert ensuite a :

- valider la navigation ;
- affiner la structure ;
- ajuster la hierarchie d information ;
- repositionner les actions critiques ;
- corriger la densite des ecrans ;
- consolider la forme attendue ;
- verifier la coherence SEO des pages publiques.

Codex doit considerer cette boucle comme normale :

- la generation n a pas pour role de figer la forme finale ;
- le prototype n a pas pour role de remplacer le cadrage ;
- les decisions du prototype doivent revenir dans le code ou dans le registre d arbitrages.

---

## 11. Validation, preuves et CI

### 11.1 Checklist adaptation

- [ ] Terminologie remappee
- [ ] Registre d arbitrages redige
- [ ] Matrice ecrans/endpoints/tests complete
- [ ] Aucun mock ou placeholder restant
- [ ] Mapping API valide
- [ ] Guards et redirections OK
- [ ] Mutualisation respectee
- [ ] `check:dom-xss` passe

### 11.2 Checklist SEO

- [ ] Statut d indexation explicite par page publique
- [ ] Strategie canonical definie
- [ ] `title`, `meta`, `canonical`, `robots` en place
- [ ] OG/Twitter en place si necessaire
- [ ] JSON-LD coherent si utilise
- [ ] Verification Lighthouse/DevTools effectuee

### 11.3 Checklist validation et preuves

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:unit`
- [ ] `npm run e2e`
- [ ] API active en environnement de test
- [ ] README et playbook synchronises
- [ ] tracabilite ecrans -> endpoints -> tests exploitable
- [ ] preuves de validation disponibles pour les parcours critiques

### 11.4 Pipeline CI

Objectif : verifier la qualite avant merge et bloquer toute integration si les checks critiques echouent.

Scripts requis :

- `ci:lint`
- `ci:typecheck`
- `ci:test`
- `ci:security`
- `ci:seo`
- `ci:build`
- `ci:check`

Workflow :

- fichier `.github/workflows/ci.yml`
- declenchement sur `pull_request` et `push` branche principale

Regle :

- merge bloque si CI rouge

Codex doit viser un etat du projet compatible avec cette CI avant toute proposition de cloture de l adaptation.

---

## 12. Versionning et livrables

### 12.1 Versionning recommande

- branche par macro-etape ;
- commits atomiques par lot coherent ;
- validation complete avant merge final.

### 12.2 Livrables minimaux

- code front adapte ;
- tests a jour ;
- preuves de validation SEO si pertinentes ;
- documentation synchronisee.

Une adaptation n est pas consideree comme terminee si ces livrables ne sont pas reunis ou explicitement exclus du perimetre.

### 12.3 Activation CI dans le repo projet

Tout projet adapte versionne sur GitHub doit activer la CI.

Actions obligatoires :

- activer GitHub Actions ;
- copier ou adapter le workflow CI du socle ;
- configurer les secrets et variables CI ;
- proteger la branche principale ;
- valider l activation avec une PR test.
