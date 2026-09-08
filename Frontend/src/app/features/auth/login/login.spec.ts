import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { LoginComponent } from './login';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';
import { ThemeService } from '../../../core/services/theme.service';

describe('Login', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
    sessionStorage.clear();
    document.body.classList.remove('dark-theme', 'light-theme', 'theme-changing');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('permite cambiar el tema desde el login', () => {
    const theme = TestBed.inject(ThemeService);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('.login-theme-toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();

    expect(theme.theme()).toBe('light');
    expect(toggle.textContent).toContain('Tema oscuro');
  });

  it('muestra inmediatamente el mensaje del backend cuando la contrasena es incorrecta', () => {
    component.email = 'cliente@nethink.test';
    component.password = 'Incorrecta123';

    component.login();

    const request = httpTesting.expectOne(`${APP_API_BASE_URL}/auth/login`);
    request.flush(
      { message: 'Credenciales incorrectas' },
      { status: 401, statusText: 'Unauthorized' }
    );

    const error = fixture.nativeElement.querySelector('.login-error') as HTMLElement | null;

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('Credenciales incorrectas');
    expect(error?.textContent).toContain('Credenciales incorrectas');
  });

  it('continua inmediatamente al MFA cuando el login es correcto', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.email = 'cliente@nethink.test';
    component.password = 'Correcta123';

    component.login();

    const request = httpTesting.expectOne(`${APP_API_BASE_URL}/auth/login`);
    request.flush({
      requiresMfa: true,
      tempToken: 'temp-token',
      email: component.email,
      purpose: 'LOGIN',
      redirectTo: '/app/dashboard',
      expiresInSeconds: 300,
      resendInSeconds: 30
    });

    expect(component.loading).toBe(false);
    expect(sessionStorage.getItem('pending_mfa_flow')).toContain('temp-token');
    expect(navigate).toHaveBeenCalledWith(['/mfa'], { replaceUrl: true });
  });
});
