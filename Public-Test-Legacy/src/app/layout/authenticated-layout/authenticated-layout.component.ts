import { Component } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
    selector: 'app-auth-layout',
    imports: [RouterOutlet, NavbarComponent, FooterComponent],
    template: `
    <app-navbar></app-navbar>
    <main class="app-main">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `
})
export class AuthenticatedLayoutComponent {}
