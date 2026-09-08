// Backend touchpoint: attaches auth tokens to API requests except login.
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../constants/app.constants';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // La consulta de RUC es publica, incluso cuando se abre desde un perfil.
    if (req.method === 'GET' && req.url.startsWith(`${APP_API_BASE_URL}/auth/proveedor/ruc/`)) {
      return next.handle(req.clone({ headers: req.headers.delete('Authorization') }));
    }

    if (req.url.includes(`${APP_API_BASE_URL}/auth/login`)) {
    return next.handle(req);
  }

  const token = localStorage.getItem(APP_STORAGE_KEYS.token);

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next.handle(cloned);
  }

  return next.handle(req);
  }
}