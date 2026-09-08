// Backend touchpoint: root shell for the app; keep route-level changes coordinated with app.routes.ts.
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor(themeService: ThemeService) {
    themeService.initialize();
  }
}
