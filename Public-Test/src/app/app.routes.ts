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
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'access-denied', component: ErrorPageComponent },
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: 'dashboard',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
            loadComponent: () =>
          import('./features/public/content/content.component').then(
            (m) => m.ContentComponent,
          ),
      },
      {
        path: 'public',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
            children: [
          { path: '', redirectTo: 'content', pathMatch: 'full' },
          {
            path: 'content',
            loadComponent: () =>
              import('./features/public/content/content.component').then(
                (m) => m.ContentComponent,
              ),
          },
        ],
      },
      {
        path: 'account',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
            children: [
          { path: '', redirectTo: 'profile', pathMatch: 'full' },
          {
            path: 'activity',
            loadComponent: () =>
              import('./features/account/activity/activity.component').then(
                (m) => m.ActivityComponent,
              ),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./features/account/profile/profile.component').then(
                (m) => m.ProfileComponent,
              ),
          },
        ],
      },
    ],
  },
  {
    path: '**',
    component: ErrorPageComponent,
    data: { reason: 'not-found' },
  },
];
