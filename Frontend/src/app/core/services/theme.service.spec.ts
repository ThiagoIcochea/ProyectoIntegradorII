import '@angular/compiler';
import { ThemeService } from './theme.service';
import { beforeEach, describe, expect, it } from 'vitest';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-theme', 'light-theme', 'theme-changing');
    service = new ThemeService(document);
  });

  it('inicia con el tema oscuro cuando no existe una preferencia', () => {
    service.initialize();

    expect(service.theme()).toBe('dark');
    expect(document.body.classList.contains('dark-theme')).toBe(true);
  });

  it('alterna el tema y conserva la preferencia', () => {
    service.initialize();
    service.toggle();

    expect(service.theme()).toBe('light');
    expect(document.body.classList.contains('light-theme')).toBe(true);
    expect(localStorage.getItem('nethink_theme')).toBe('light');
  });

  it('restaura el tema claro guardado', () => {
    localStorage.setItem('nethink_theme', 'light');

    service.initialize();

    expect(service.theme()).toBe('light');
    expect(document.body.classList.contains('light-theme')).toBe(true);
  });

  it('restablece el tema oscuro y elimina la preferencia al cerrar sesion', () => {
    service.initialize();
    service.toggle();

    service.resetToDefault();

    expect(service.theme()).toBe('dark');
    expect(document.body.classList.contains('dark-theme')).toBe(true);
    expect(localStorage.getItem('nethink_theme')).toBeNull();
  });
});
