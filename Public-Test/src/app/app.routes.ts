import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { VerifyEmailComponent } from './features/auth/verify-email.component';
import { HomeComponent } from './features/public/home/home.component';
import { AuthenticatedLayoutComponent } from './layout/authenticated-layout/authenticated-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { authMatchGuard } from './core/guards/auth-match.guard';
import { guestGuard } from './core/guards/guest.guard';
import { ErrorPageComponent } from './shared/components/error-page/error-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    component: HomeComponent,
    data: {
      seo: {
        title: 'Ma Boutique | Accueil',
        description: 'Decouvrez les produits de Ma Boutique et connectez-vous pour gerer votre panier.',
        indexable: true,
        canonicalPath: '/home',
      },
    },
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
    data: {
      seo: {
        title: 'Ma Boutique | Connexion',
        description: 'Connectez-vous a votre espace client Ma Boutique.',
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
        description: 'Creez votre compte client pour commander sur Ma Boutique.',
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
        description: 'Verification de votre adresse email.',
        indexable: false,
        canonicalPath: '/verify-email',
      },
    },
  },
  {
    path: 'access-denied',
    component: ErrorPageComponent,
    data: {
      reason: 'forbidden',
      seo: {
        title: 'Ma Boutique | Acces refuse',
        description: 'Vous ne disposez pas des droits necessaires pour acceder a cette page.',
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
        pathMatch: 'full',
        redirectTo: 'catalog',
      },
      {
        path: 'catalog',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/public/content/content.component').then(
            (m) => m.ContentComponent,
          ),
        data: {
          seo: {
            title: 'Ma Boutique | Catalogue',
            description: 'Consultez le catalogue produits et ajoutez des articles au panier.',
            indexable: false,
            canonicalPath: '/catalog',
          },
        },
      },
      {
        path: 'account',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        children: [
          { path: '', redirectTo: 'profile', pathMatch: 'full' },
          {
            path: 'cart',
            loadComponent: () =>
              import('./features/account/activity/activity.component').then(
                (m) => m.ActivityComponent,
              ),
            data: {
              seo: {
                title: 'Ma Boutique | Panier',
                description: 'Consultez et mettez a jour votre panier.',
                indexable: false,
                canonicalPath: '/account/cart',
              },
            },
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./features/account/profile/profile.component').then(
                (m) => m.ProfileComponent,
              ),
            data: {
              seo: {
                title: 'Ma Boutique | Profil',
                description: 'Consultez votre profil client.',
                indexable: false,
                canonicalPath: '/account/profile',
              },
            },
          },
          { path: 'activity', pathMatch: 'full', redirectTo: 'cart' },
        ],
      },
      { path: 'public/content', pathMatch: 'full', redirectTo: 'catalog' },
    ],
  },
  {
    path: '**',
    component: ErrorPageComponent,
    data: {
      reason: 'not-found',
      seo: {
        title: 'Ma Boutique | Page introuvable',
        description: 'La page demandee est introuvable.',
        indexable: false,
      },
    },
  },
];
