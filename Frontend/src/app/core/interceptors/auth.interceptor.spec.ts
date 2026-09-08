import { HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthInterceptor } from './auth.interceptor';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../constants/app.constants';

describe('Public RUC authentication', () => {
  afterEach(() => localStorage.removeItem(APP_STORAGE_KEYS.token));
  it('omits stored and explicit credentials for the public RUC lookup', () => {
    localStorage.setItem(APP_STORAGE_KEYS.token, 'expired-token');
    const handler = { handle: vi.fn(() => of(new HttpResponse())) };
    const request = new HttpRequest('GET', `${APP_API_BASE_URL}/auth/proveedor/ruc/20291973851`)
      .clone({setHeaders: {Authorization: 'Bearer old'}});
    new AuthInterceptor().intercept(request, handler).subscribe();
    expect((handler.handle.mock.calls[0] as any)[0].headers.has('Authorization')).toBe(false);
  });
});
