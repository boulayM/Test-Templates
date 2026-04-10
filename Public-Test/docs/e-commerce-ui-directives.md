# UI Directives

## 1. Objet

Ce document decrit le cadrage front a fournir pour adapter un projet e-commerce au socle `Public-Angular-Shell`.

Il complete :

- le playbook d adaptation ;
- le contrat API du projet ;
- les arbitrages de cadrage necessaires a l implementation du front.

## 2. Regles generales

- Domaine : e-commerce
- Public cible : visiteur non authentifie et utilisateur connecte (USER)
- Objectif principal du front : consultation catalogue, consultation detail produit, authentification, gestion de compte/panier/commandes
- Authentification requise : oui, pour les pages compte, panier, commandes, checkout, paiement
- Contraintes particulieres : SEO route-driven, verification email, pages systeme, responsive desktop/mobile, UI neutre (Bootstrap + Bootstrap Icons), placeholder image produit

## 3. Parcours principaux

- Parcours 1 : consulter l accueil et le produit mis en avant
- Parcours 2 : consulter le catalogue par categories
- Parcours 3 : consulter le detail d un produit
- Parcours 4 : se connecter depuis page login ou modale navbar
- Parcours 5 : acceder aux pages compte (profil, adresses, panier, commandes)
- Parcours 6 : lancer checkout puis paiement

## 4. Cartographie des pages

Note :

- les pages systeme transverses du socle peuvent etre deja presentes avant tout cadrage metier ;
- cela inclut notamment les pages d erreur, de page introuvable et de refus d acces ;
- ces pages ne doivent etre redecrites dans le cadrage projet que si leur comportement ou leur contenu doit differer du standard du socle.

### Page

- Nom : Accueil
- Archetype : landing-page
- Route : /home
- Acteur(s) : visiteur, utilisateur connecte
- Objectif : exposer une entree claire vers le catalogue et le produit mis en avant
- Donnees affichees : produit du mois, sous-ensemble de produits references, categories via navbar secondaire
- Actions autorisees : ouvrir detail produit, aller au catalogue, naviguer par categorie
- Endpoints utilises : GET /products (actifs), GET /categories
- Regles d acces : publique
- Liens sortants : /catalog, /products/:id, /catalog?category=:slug
- Etats UI a gerer : loading, erreur, vide
- Arbitrages restants : aucun

### Page

- Nom : Catalogue
- Archetype : list-page
- Route : /catalog
- Acteur(s) : visiteur, utilisateur connecte
- Objectif : lister les produits disponibles
- Donnees affichees : cards produit (image placeholder, nom, description, prix, disponibilite, categories)
- Actions autorisees : voir detail, ajouter au panier (connecte seulement)
- Endpoints utilises : GET /products, GET /categories
- Regles d acces : publique
- Liens sortants : /products/:id, /catalog?category=:slug
- Etats UI a gerer : loading, erreur, vide
- Arbitrages restants : aucun

### Page

- Nom : Detail produit
- Archetype : detail-page
- Route : /products/:id
- Acteur(s) : visiteur, utilisateur connecte
- Objectif : consulter un produit et ses avis, permettre ajout panier si connecte
- Donnees affichees : details produit, prix, categories, avis
- Actions autorisees : retour catalogue, ajouter au panier (connecte), publier avis selon regles
- Endpoints utilises : GET /products/:id, GET /reviews/:productId, POST /cart/items, POST /reviews
- Regles d acces : publique pour lecture, actions sensibles conditionnees par auth
- Liens sortants : /catalog, /account/cart
- Etats UI a gerer : loading, erreur, vide avis
- Arbitrages restants : aucun

### Page

- Nom : Connexion
- Archetype : auth-page
- Route : /login
- Acteur(s) : visiteur
- Objectif : authentifier un utilisateur
- Donnees affichees : formulaire login + lien inscription
- Actions autorisees : se connecter, aller vers /register
- Endpoints utilises : POST /auth/login, GET /auth/me
- Regles d acces : guest only
- Liens sortants : /home, /register
- Etats UI a gerer : validation, erreur auth, loading
- Arbitrages restants : aucun

### Page

- Nom : Inscription
- Archetype : auth-page
- Route : /register
- Acteur(s) : visiteur
- Objectif : exposer le point d entree inscription (mode demo desactive)
- Donnees affichees : formulaire inscription desactive, message de contexte
- Actions autorisees : retour accueil
- Endpoints utilises : POST /auth/register (hors demo active)
- Regles d acces : guest only
- Liens sortants : /home
- Etats UI a gerer : message info
- Arbitrages restants : aucun

### Page

- Nom : Verification email
- Archetype : auth-page
- Route : /verify-email
- Acteur(s) : visiteur, utilisateur connecte selon flux
- Objectif : verifier l email utilisateur
- Donnees affichees : etat verification
- Actions autorisees : retour login/home selon resultat
- Endpoints utilises : GET /auth/verify-email
- Regles d acces : publique (token-based)
- Liens sortants : /login, /home
- Etats UI a gerer : succes, echec, token invalide
- Arbitrages restants : aucun

### Page

- Nom : Profil compte
- Archetype : account-page
- Route : /account/profile
- Acteur(s) : utilisateur connecte
- Objectif : consulter les informations de compte
- Donnees affichees : profil utilisateur
- Actions autorisees : navigation interne compte
- Endpoints utilises : GET /auth/me
- Regles d acces : auth requise
- Liens sortants : /account/addresses, /account/cart, /account/orders
- Etats UI a gerer : loading, erreur
- Arbitrages restants : aucun

### Page

- Nom : Adresses
- Archetype : account-page
- Route : /account/addresses
- Acteur(s) : utilisateur connecte
- Objectif : consulter les adresses
- Donnees affichees : adresses utilisateur
- Actions autorisees : navigation interne compte
- Endpoints utilises : GET /addresses
- Regles d acces : auth requise
- Liens sortants : /account/profile, /account/cart
- Etats UI a gerer : loading, erreur, vide
- Arbitrages restants : aucun

### Page

- Nom : Panier
- Archetype : account-page
- Route : /account/cart
- Acteur(s) : utilisateur connecte
- Objectif : gerer les articles panier
- Donnees affichees : lignes panier, total, coupon
- Actions autorisees : modifier quantite, supprimer ligne, appliquer coupon, lancer checkout
- Endpoints utilises : GET /cart, PATCH /cart/items/:id, DELETE /cart/items/:id, POST /coupons/apply
- Regles d acces : auth requise
- Liens sortants : /checkout, /catalog
- Etats UI a gerer : loading, erreur, vide, succes coupon
- Arbitrages restants : aucun

### Page

- Nom : Commandes
- Archetype : history-page
- Route : /account/orders
- Acteur(s) : utilisateur connecte
- Objectif : consulter l historique des commandes
- Donnees affichees : liste commandes
- Actions autorisees : voir detail commande
- Endpoints utilises : GET /orders
- Regles d acces : auth requise
- Liens sortants : /account/orders/:id
- Etats UI a gerer : loading, erreur, vide
- Arbitrages restants : aucun

### Page

- Nom : Detail commande
- Archetype : detail-page
- Route : /account/orders/:id
- Acteur(s) : utilisateur connecte
- Objectif : consulter detail d une commande
- Donnees affichees : recap commande, paiement, livraison
- Actions autorisees : aller paiement si necessaire
- Endpoints utilises : GET /orders/:id
- Regles d acces : auth requise
- Liens sortants : /payment/:orderId, /account/orders
- Etats UI a gerer : loading, erreur
- Arbitrages restants : aucun

### Page

- Nom : Checkout
- Archetype : checkout-page
- Route : /checkout
- Acteur(s) : utilisateur connecte
- Objectif : preparer et confirmer la commande
- Donnees affichees : recap panier + adresses
- Actions autorisees : confirmer commande
- Endpoints utilises : POST /orders, GET /cart, GET /addresses
- Regles d acces : auth requise
- Liens sortants : /payment/:orderId
- Etats UI a gerer : loading, erreur, succes
- Arbitrages restants : aucun

### Page

- Nom : Paiement
- Archetype : checkout-page
- Route : /payment/:orderId
- Acteur(s) : utilisateur connecte
- Objectif : finaliser le paiement
- Donnees affichees : recap montant et statut
- Actions autorisees : confirmer paiement
- Endpoints utilises : POST /payments, GET /orders/:id
- Regles d acces : auth requise
- Liens sortants : /account/orders/:id
- Etats UI a gerer : loading, erreur, succes
- Arbitrages restants : aucun

## 5. Comportements transverses

- Navbar :
  - principale avec burger menu mobile (dropdown compact), liens Accueil/Catalogue, zone auth differenciee ;
  - secondaire categories, wrap multi-lignes en mobile.
- Footer : present, horizontal desktop, empilement vertical mobile.
- Login : page dediee + modale navbar.
- Register : page dediee, formulaire desactive en mode demo.
- Verification email : page dediee.
- Etats non authentifies : acces public conserve, actions sensibles masquees/conditionnees.
- SEO :
  - indexables : /home, /catalog, /products/:id ;
  - non indexables : auth, account, system.
- Messages systeme importants : pages d erreur standards du socle.

Pages systeme deja fournies par le socle :

- `/access-denied`
- `/forbidden`
- `/session-expired`
- `/service-unavailable`
- `/server-error`
- route `not-found` via la page de fallback

## 6. Points non couverts

- wording marketing final (copywriting)
- habillage de marque (palette/typo finale)
- politique de pagination/tris avances si volume catalogue eleve
- strategie SEO avancee (schema enrichi produit) au-dela du minimum

## 7. Regle d utilisation

Ce document doit etre fourni a Codex en complement du playbook et du contrat API.

Le playbook ne remplace pas ce cadrage :

- il dit comment adapter ;
- il ne dit pas quelles pages precises le projet doit contenir.

Le contrat API ne remplace pas ce cadrage non plus :

- il dit ce qui est techniquement possible ;
- il ne dit pas ce qui doit etre affiche, ni ou, ni avec quelle priorite.

Aucune adaptation ne doit etre conduite sans un cadrage front minimal explicite.
