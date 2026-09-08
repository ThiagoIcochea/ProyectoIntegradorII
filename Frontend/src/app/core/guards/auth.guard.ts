// Frontend route guard: blocks private app routes when there is no active token or the role cannot access the requested route.
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../constants/app.constants';

const hasToken = (): boolean => {
  const token = localStorage.getItem(APP_STORAGE_KEYS.token);

  return !!token && token !== 'null' && token.trim() !== '';
};

const normalizeRole = (value: string | null | undefined): string => {
  return (value || '').toUpperCase().replace(/^ROLE_/, '').trim();
};

const roleCanAccessRoute = (role: string, url: string): boolean => {
  const normalizedUrl = url.toLowerCase();
  const normalizedRole = role.toUpperCase();

  if (normalizedRole === 'ADMIN') {
    return normalizedUrl.includes('/app/admin/') || normalizedUrl.includes('/app/dashboard') || normalizedUrl.includes('/app/profile');
  }

  if (normalizedRole === 'PROVEEDOR') {
    return normalizedUrl.includes('/app/provider/') || normalizedUrl.includes('/app/profile');
  }

  return normalizedUrl.includes('/app/dashboard')
    || normalizedUrl.includes('/app/rfq/')
    || normalizedUrl.includes('/app/requests')
    || normalizedUrl.includes('/app/history')
    || normalizedUrl.includes('/app/profile');
};

const canAccessPrivateRoute = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree => {
  const router = inject(Router);
  const url = state.url;

  if (!hasToken()) {
    return router.createUrlTree([APP_ROUTE_PATHS.login]);
  }

  const role = normalizeRole(localStorage.getItem(APP_STORAGE_KEYS.role));
  if (role && !roleCanAccessRoute(role, url)) {
    const fallback = role === 'ADMIN'
      ? APP_ROUTE_PATHS.adminDashboard
      : role === 'PROVEEDOR'
        ? APP_ROUTE_PATHS.providerDashboard
        : APP_ROUTE_PATHS.clientDashboard;

    return router.createUrlTree([fallback]);
  }

  return true;
};

export const authGuard: CanActivateFn = (route, state) => canAccessPrivateRoute(route, state);

export const authChildGuard: CanActivateChildFn = (childRoute, state) => canAccessPrivateRoute(childRoute, state);
