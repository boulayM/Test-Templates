import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-figma-footer',
  templateUrl: './landing-figma-footer.component.html',
  styleUrls: ['./landing-figma-footer.component.css'],
  standalone: true,
})
export class LandingFigmaFooterComponent {
  currentYear: number = new Date().getFullYear();
}
