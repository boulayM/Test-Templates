import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { VerifyEmailComponent } from './features/auth/verify-email.component';
import { ProductDetailComponent } from './features/public/product-detail/product-detail.component';
import { HomeComponent } from './features/public/home/home.component';
import { InfoPageComponent } from './features/public/info-page/info-page.component';
import { AuthenticatedLayoutComponent } from './layout/authenticated-layout/authenticated-layout.component';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { ErrorPageComponent } from './shared/components/error-page/error-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: 'home',
        component: HomeComponent,
        data: {
          seo: {
            title: 'Ma Boutique | Accueil',
            description: 'Produit du mois, categories et acces rapide au catalogue.',
            indexable: true,
            canonicalPath: '/home',
          },
        },
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('./features/public/content/content.component').then((m) => m.ContentComponent),
        data: {
          seo: {
            title: 'Ma Boutique | Catalogue',
            description: 'Catalogue public des produits disponibles par categorie.',
            indexable: true,
            canonicalPath: '/catalog',
          },
        },
      },
      {
        path: 'products/:id',
        component: ProductDetailComponent,
        data: {
          seo: {
            title: 'Ma Boutique | Produit',
            description: 'Detail produit, avis clients et acces au panier.',
            indexable: true,
          },
        },
      },
      {
        path: 'info/:slug',
        component: InfoPageComponent,
        data: {
          seo: {
            title: 'Ma Boutique | Information',
            description: 'Page informative temporairement indisponible.',
            indexable: true,
          },
        },
      },
    ],
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
    data: {
      seo: {
        title: 'Ma Boutique | Connexion',
        description: 'Connexion a l espace client.',
        indexable: false,
        canonicalPath: '/login',
      },
    },
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard],
    data: {
      seo: {
        title: 'Ma Boutique | Inscription',
        description: 'Inscription client non disponible dans cette demo.',
        indexable: false,
        canonicalPath: '/register',
      },
    },
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent,
    data: {
      seo: {
        title: 'Ma Boutique | Verification email',
        description: 'Validation de votre adresse email.',
        indexable: false,
        canonicalPath: '/verify-email',
      },
    },
  },
  {
    path: 'access-denied',
    component: ErrorPageComponent,
    data: {
      reason: 'auth',
      seo: {
        title: 'Public Shell | Acces refuse',
        description: 'Vous ne disposez pas des droits necessaires.',
        indexable: false,
      },
    },
  },
  {
    path: 'forbidden',
    component: ErrorPageComponent,
    data: {
      reason: 'role',
      seo: {
        title: 'Public Shell | Droits insuffisants',
        description: 'Vous ne disposez pas des droits necessaires.',
        indexable: false,
      },
    },
  },
  {
    path: 'session-expired',
    component: ErrorPageComponent,
    data: {
      reason: 'session',
      seo: {
        title: 'Public Shell | Session expiree',
        description: 'Votre session a expire. Reconnectez-vous pour continuer.',
        indexable: false,
      },
    },
  },
  {
    path: 'service-unavailable',
    component: ErrorPageComponent,
    data: {
      reason: 'unavailable',
      seo: {
        title: 'Public Shell | Service indisponible',
        description: 'Le service est temporairement indisponible.',
        indexable: false,
      },
    },
  },
  {
    path: 'server-error',
    component: ErrorPageComponent,
    data: {
      reason: 'server',
      seo: {
        title: 'Public Shell | Erreur serveur',
        description: 'Une erreur serveur est survenue.',
        indexable: false,
      },
    },
  },
  {
    path: 'error',
    component: ErrorPageComponent,
    data: {
      reason: 'generic',
      seo: {
        title: 'Public Shell | Erreur',
        description: 'Une erreur est survenue.',
        indexable: false,
      },
    },
  },
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: 'dashboard',
        redirectTo: 'account/profile',
        pathMatch: 'full',
      },
      {
        path: 'account',
        canActivate: [authGuard],
        children: [
          { path: '', redirectTo: 'profile', pathMatch: 'full' },
          {
            path: 'addresses',
            data: {
              seo: {
                title: 'Ma Boutique | Mes adresses',
                description: 'Consultation des adresses de livraison et de facturation.',
                indexable: false,
                canonicalPath: '/account/addresses',
              },
            },
            loadComponent: () =>
              import('./features/account/addresses/addresses.component').then((m) => m.AddressesComponent),
          },
          {
            path: 'cart',
            data: {
              seo: {
                title: 'Ma Boutique | Mon panier',
                description: 'Gestion du panier et validation des coupons.',
                indexable: false,
                canonicalPath: '/account/cart',
              },
            },
            loadComponent: () =>
              import('./features/account/activity/activity.component').then((m) => m.ActivityComponent),
          },
          {
            path: 'orders',
            data: {
              seo: {
                title: 'Ma Boutique | Mes commandes',
                description: 'Historique des commandes et suivi.',
                indexable: false,
                canonicalPath: '/account/orders',
              },
            },
            loadComponent: () =>
              import('./features/account/orders/orders.component').then((m) => m.OrdersComponent),
          },
          {
            path: 'orders/:id',
            data: {
              seo: {
                title: 'Ma Boutique | Detail commande',
                description: 'Detail d une commande, paiements et livraison.',
                indexable: false,
              },
            },
            loadComponent: () =>
              import('./features/account/order-detail/order-detail.component').then(
                (m) => m.OrderDetailComponent,
              ),
          },
          {
            path: 'profile',
            data: {
              seo: {
                title: 'Ma Boutique | Mon compte',
                description: 'Consultation des informations du compte client.',
                indexable: false,
                canonicalPath: '/account/profile',
              },
            },
            loadComponent: () =>
              import('./features/account/profile/profile.component').then((m) => m.ProfileComponent),
          },
        ],
      },
      {
        path: 'checkout',
        data: {
          seo: {
            title: 'Ma Boutique | Checkout',
            description: 'Confirmation de commande et choix des adresses.',
            indexable: false,
            canonicalPath: '/checkout',
          },
        },
        loadComponent: () =>
          import('./features/account/checkout/checkout.component').then((m) => m.CheckoutComponent),
      },
      {
        path: 'payment/:orderId',
        data: {
          seo: {
            title: 'Ma Boutique | Paiement',
            description: 'Page de paiement de demonstration.',
            indexable: false,
          },
        },
        loadComponent: () =>
          import('./features/account/payment/payment.component').then((m) => m.PaymentComponent),
      },
    ],
  },
  {
    path: '**',
    component: ErrorPageComponent,
    data: {
      reason: 'not-found',
      seo: {
        title: 'Public Shell | Page introuvable',
        description: 'La page demandee est introuvable.',
        indexable: false,
      },
    },
  },
];
