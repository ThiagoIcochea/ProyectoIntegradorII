// Backend touchpoint: route map for all app flows; update this file when new backend-backed screens are added.
import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { authChildGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'mfa',
    loadComponent: () =>
      import('./features/auth/mfa/mfa').then(m => m.MfaComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'select-role',
    loadComponent: () =>
      import('./features/public/role-selection/role-selection').then(m => m.RoleSelectionComponent)
  },
  {
    path: 'register-client',
    loadComponent: () =>
      import('./features/auth/register-client/register-client').then(m => m.RegisterClientComponent)
  },
  {
    path: 'register-provider',
    loadComponent: () =>
      import('./features/auth/register-provider/register-provider').then(m => m.RegisterProviderComponent)
  },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/client/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'rfq/catalog',
        loadComponent: () =>
          import('./features/client/rfq-catalog/rfq-catalog').then(m => m.RfqCatalogComponent)
      },

      // ── NUEVAS RUTAS ──────────────────────────────────────────────────────
      {
        path: 'rfq/product/:id',
        loadComponent: () =>
          import('./features/client/product-detail/product-detail').then(m => m.ProductDetailComponent)
      },
      {
        path: 'rfq/provider-reviews',
        loadComponent: () =>
          import('./features/client/provider-reviews/provider-reviews').then(m => m.ProviderReviewsComponent)
      },
      // ─────────────────────────────────────────────────────────────────────

      {
        path: 'rfq/results',
        loadComponent: () =>
          import('./features/client/rfq-results/rfq-results').then(m => m.RfqResultsComponent)
      },
      {
        path: 'rfq/quotation',
        loadComponent: () =>
          import('./features/client/rfq-quotation/rfq-quotation').then(m => m.RfqQuotationComponent)
      },
      {
        path: 'rfq/payment',
        loadComponent: () =>
          import('./features/client/rfq-payment/rfq-payment').then(m => m.RfqPaymentComponent)
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./features/client/requests/requests').then(m => m.RequestsComponent)
      },
      {
        path: 'requests/tracking/:id',
        loadComponent: () =>
          import('./features/client/request-tracking/request-tracking').then(m => m.RequestTrackingComponent)
      },
     {
  path: 'requests/evaluation/:id',
  loadComponent: () =>
    import('./features/client/request-evaluation/request-evaluation')
      .then(m => m.RequestEvaluationComponent)
},
      {
        path: 'history',
        loadComponent: () =>
          import('./features/client/history/history').then(m => m.HistoryComponent)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/client/profile/profile').then(m => m.ProfileComponent)
      },
      {
        path: 'provider/dashboard',
        loadComponent: () =>
          import('./features/provider/dashboard/dashboard').then(m => m.ProviderDashboardComponent)
      },
      {
        path: 'provider/requests',
        loadComponent: () =>
          import('./features/provider/requests/requests').then(m => m.ProviderRequestsComponent)
      },
      {
        path: 'provider/payments',
        loadComponent: () =>
          import('./features/provider/payments/payments').then(m => m.ProviderPaymentsComponent)
      },
      {
        path: 'provider/claims',
        loadComponent: () =>
          import('./features/provider/claims/claims').then(m => m.ProviderClaimsComponent)
      },
      {
        path: 'provider/deliveries',
        loadComponent: () =>
          import('./features/provider/deliveries/deliveries').then(m => m.ProviderDeliveriesComponent)
      },
      {
        path: 'provider/products',
        loadComponent: () =>
          import('./features/provider/products/products').then(m => m.ProviderProductsComponent)
      },
      {
        path: 'provider/profile',
        loadComponent: () =>
          import('./features/client/profile/profile').then(m => m.ProfileComponent)
      },
      {
        path: 'admin/dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./features/admin/users/users').then(m => m.AdminUsersComponent)
      },
      {
        path: 'admin/providers',
        loadComponent: () =>
          import('./features/admin/providers/providers').then(m => m.AdminProvidersComponent)
      },
      {
        path: 'admin/rfqs',
        loadComponent: () =>
          import('./features/admin/rfqs/rfqs').then(m => m.AdminRfqsComponent)
      },
      {
        path: 'admin/products',
        loadComponent: () =>
          import('./features/admin/products/products').then(m => m.AdminProductsComponent)
      },
      {
        path: 'admin/integrations',
        loadComponent: () =>
          import('./features/admin/integrations/integrations').then(m => m.AdminIntegrationsComponent)
      },
      {
        path: 'admin/security',
        loadComponent: () =>
          import('./features/admin/security/security').then(m => m.AdminSecurityComponent)
      },
      {
        path: 'admin/logs',
        loadComponent: () =>
          import('./features/admin/logs/logs').then(m => m.AdminLogsComponent)
      },
      {
        path: 'admin/settings',
        loadComponent: () =>
          import('./features/admin/settings/settings').then(m => m.AdminSettingsComponent)
      },
      {
        path: 'provider/api-settings',
        loadComponent: () =>
          import('./features/provider/api-settings/api-settings').then(m => m.ProviderApiSettingsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

