import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { ForgotPasswordComponent } from './forgot-password';
import { APP_API_BASE_URL, APP_ROUTE_PATHS } from '../../../core/constants/app.constants';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('muestra el codigo, permite crear la contrasena y vuelve al login', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.email = 'cliente@nethink.test';

    component.start();

    const startRequest = httpTesting.expectOne(`${APP_API_BASE_URL}/auth/forgot-password/start`);
    expect(startRequest.request.body).toEqual({
      email: 'cliente@nethink.test',
      method: 'email'
    });
    startRequest.flush({ tempToken: 'reset-temp-token' });

    expect(component.step).toBe('code');
    expect(fixture.nativeElement.querySelectorAll('[id^="reset-digit-"]').length).toBe(6);

    component.digits = ['1', '2', '3', '4', '5', '6'];
    component.verifyCode();

    const verifyRequest = httpTesting.expectOne(`${APP_API_BASE_URL}/auth/mfa/verify`);
    expect(verifyRequest.request.body).toMatchObject({
      email: 'cliente@nethink.test',
      tempToken: 'reset-temp-token',
      code: '123456',
      purpose: 'PASSWORD_RESET'
    });
    verifyRequest.flush({ mfaActionToken: 'reset-action-token' });

    expect(component.step).toBe('password');
    expect(fixture.nativeElement.querySelector('[name="newPassword"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[name="confirmPassword"]')).toBeTruthy();

    component.newPassword = 'NuevaClave1';
    component.confirmPassword = 'NuevaClave1';
    component.complete();

    const completeRequest = httpTesting.expectOne(`${APP_API_BASE_URL}/auth/forgot-password/complete`);
    expect(completeRequest.request.body).toEqual({
      email: 'cliente@nethink.test',
      mfaActionToken: 'reset-action-token',
      newPassword: 'NuevaClave1'
    });
    completeRequest.flush({ message: 'Contrasena actualizada correctamente' });

    expect(navigate).toHaveBeenCalledWith([APP_ROUTE_PATHS.login], { replaceUrl: true });
  });
});
