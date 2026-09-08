import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, signal } from '@angular/core';

export type AppTheme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'nethink_theme';
  private readonly activeTheme = signal<AppTheme>('dark');
  readonly theme = this.activeTheme.asReadonly();

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  initialize(): void {
    const savedTheme = this.readSavedTheme();
    this.applyTheme(savedTheme ?? 'dark', false);
  }

  toggle(): void {
    this.applyTheme(this.activeTheme() === 'dark' ? 'light' : 'dark', true);
  }

  resetToDefault(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // El tema se restablece aunque el almacenamiento este bloqueado.
    }

    this.applyTheme('dark', true, false);
  }

  private applyTheme(theme: AppTheme, animate: boolean, persist = true): void {
    const body = this.document.body;

    if (animate) {
      body.classList.add('theme-changing');
      window.setTimeout(() => body.classList.remove('theme-changing'), 240);
    }

    body.classList.toggle('dark-theme', theme === 'dark');
    body.classList.toggle('light-theme', theme === 'light');
    this.document.documentElement.style.colorScheme = theme;
    this.activeTheme.set(theme);

    if (persist) {
      try {
        localStorage.setItem(this.storageKey, theme);
      } catch {
        // El tema sigue funcionando aunque el almacenamiento esté bloqueado.
      }
    }
  }

  private readSavedTheme(): AppTheme | null {
    try {
      const savedTheme = localStorage.getItem(this.storageKey);
      return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
    } catch {
      return null;
    }
  }
}
