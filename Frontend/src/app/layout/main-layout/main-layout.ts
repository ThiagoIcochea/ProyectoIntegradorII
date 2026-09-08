// Backend touchpoint: main shell that loads the active user profile, role labels and logout cleanup.
import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { forkJoin } from 'rxjs';
import { APP_API_BASE_URL, APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../../core/constants/app.constants';
import { ProviderShellDataService } from '../../core/services/provider-shell-data.service';
import { ThemeService } from '../../core/services/theme.service';
import { VoiceAssistantComponent } from '../../shared/voice-assistant/voice-assistant';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    VoiceAssistantComponent
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy {

  usuario: any = {
    nombres: '',
    apellidos: '',
    rol: '',
    fotoPerfil: ''
  };

  

  estadoApi: string = 'Desconectada';
  providerRequestCount = 0;
  providerPaymentCount = 0;
  providerDeliveryCount = 0;
  providerClaimCount = 0;
  menuMovilAbierto = false;
  plansModalOpen = false;
  selectedProviderPlanId : number = 1;
  providerPlanBillingCycle: '1' | '3' | '6' = '1';
  providerPlanPaymentReady = false;
  providerPlanSubmitting = false;
  globalSearchTerm = '';
  providerAccessBlocked = false;
  providerAccessMessage = '';

  providerPlans = [
    {
      id: 1,
      name: 'Freemium',
      price: 0,
      badge: '1 mes gratis',
      description: 'Acceso base al sistema durante el primer mes.',
      features: [
        'Sistema operativo del proveedor',
        'Sin anuncios para clientes',
        'Sin reportes avanzados'
      ]
    },
    {
      id: 2,
      name: 'Estándar',
      price: 249,
      badge: 'Gestión diaria',
      description: 'Herramientas para administrar catálogo, stock y solicitudes.',
      features: [
        'Sistema de gestión de inventarios',
        'Alertas de stock',
        'Alertas de solicitudes'
      ]
    },
    {
      id: 3,
      name: 'Premium',
      price: 500,
      badge: 'Mayor exposición',
      description: 'Incluye promoción comercial y reportes para vender más.',
      features: [
        'Todo lo del plan Estándar',
        'Anuncios a clientes',
        'Reportes comerciales'
      ]
    }
  ];

  providerPlanPayment = {
    payerName: '',
    payerEmail: ''
  };
  private fotoPerfilCacheBust = Date.now();
  private providerCountsRefreshHandler = () => {
    if (this.isProvider) {
      this.cargarIndicadoresProveedor(true);
    }
  };
  private profileUpdatedHandler = (event: Event) => {
    const updatedUser = (event as CustomEvent<any>).detail;

    if (updatedUser) {
      this.usuario = {
        ...this.usuario,
        ...updatedUser
      };
      this.fotoPerfilCacheBust = Date.now();
      this.cdr.detectChanges();
      return;
    }

    this.cargarPerfil();
  };
  private voiceOpenProviderPlansHandler = (): void => {
    if (this.isProvider) {
      this.abrirPlanesProveedor();
    }
  };

  constructor(
    public router: Router,
    private http: HttpClient,
    private providerShellData: ProviderShellDataService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    window.addEventListener('profileUpdated', this.profileUpdatedHandler);
    window.addEventListener('providerCountsRefresh', this.providerCountsRefreshHandler);
    window.addEventListener('voiceOpenProviderPlans', this.voiceOpenProviderPlansHandler);
    this.cargarPlanProveedorLocal();
    this.cargarPerfil();
    if (this.isProvider) {
      this.cargarEstadoApi();
      this.cargarIndicadoresProveedor();
    }
  }

  get isDarkTheme(): boolean {
    return this.themeService.theme() === 'dark';
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  get currentProviderPlan(): any {
    return this.providerPlans.find(plan => plan.id === this.selectedProviderPlanId) ||
      this.providerPlans[0];
  }

  get selectedProviderPlan(): any {
    return this.providerPlans.find(plan => plan.id === this.selectedProviderPlanId) ||
      this.currentProviderPlan;
  }

  get selectedPlanTotal(): number {
    return this.selectedProviderPlan.price * Number(this.providerPlanBillingCycle);
  }

  get selectedPlanPayload(): any {
    return {
      providerEmail: this.usuario?.correo || '',
      providerName: this.nombreCompleto,
      planId: this.selectedProviderPlan.id,
      planName: this.selectedProviderPlan.name,
      billingCycleMonths: Number(this.providerPlanBillingCycle),
      amount: this.selectedPlanTotal,
      currency: 'PEN',
      description: `Plan ${this.selectedProviderPlan.name} por ${this.providerPlanBillingCycle} mes(es)`,
      payer: {
        name: this.providerPlanPayment.payerName.trim(),
        email: this.providerPlanPayment.payerEmail.trim()
      },
      paypal: {
        intent: 'CAPTURE',
        flow: 'checkout',
        returnUrl: `${location.origin}/app/provider/dashboard`,
        cancelUrl: `${location.origin}/app/provider/dashboard`
      }
    };
  }

  get canPrepareProviderPlanPayment(): boolean {
    if (this.providerPlanSubmitting) {
      return false;
    }

    return true;
  }

  get canAccessProviderShell(): boolean {
    return !this.providerAccessBlocked;
  }

  get canAccessProviderDashboard(): boolean {
    return this.selectedProviderPlanId === 3 && !this.providerAccessBlocked;
  }

  get shouldRedirectProviderToRequests(): boolean {
    return this.isProvider && !this.canAccessProviderDashboard && !this.providerAccessBlocked;
  }

  get isProviderDashboardRoute(): boolean {
    return this.router.url.startsWith('/app/provider/dashboard');
  }

  abrirPlanesProveedor(): void {
    if (!this.isProvider) {
      return;
    }

    this.plansModalOpen = true;
    this.providerPlanPaymentReady = false;
    this.hidratarPagoPlanProveedor();
  }

  cerrarPlanesProveedor(): void {
    this.plansModalOpen = false;
  }

  seleccionarPlanProveedor(planId: number): void {
    this.selectedProviderPlanId = planId;
    this.providerPlanPaymentReady = false;

    if (planId === 1) {
      this.providerPlanBillingCycle = '1';
    }
  }

  prepararPagoPlanProveedor(): void {
    if (this.providerPlanSubmitting || !this.canPrepareProviderPlanPayment) {
      return;
    }

    if (this.selectedProviderPlan.id === 1 && this.providerAccessBlocked) {
      this.providerAccessMessage = 'Tu acceso ha vencido. Puedes elegir Estándar o Premium para continuar.';
      this.cdr.detectChanges();
      return;
    }

    const payload = this.selectedPlanPayload;

    localStorage.setItem(
      'provider_plan_checkout_payload',
      JSON.stringify(payload)
    );

    if (this.selectedProviderPlan.id === 1) {
      this.providerAccessMessage = 'Freemium ya fue utilizado. Elige Estándar o Premium para continuar.';
      this.cdr.detectChanges();
      return;
    }

    const userId = this.getActiveUserId();

    if (!userId) {
      this.providerAccessMessage = 'No fue posible identificar el usuario para iniciar el pago.';
      this.cdr.detectChanges();
      return;
    }

    this.providerPlanSubmitting = true;
    this.providerPlanPaymentReady = true;

    const request = {
      idUsuario: userId,
      idPlan: this.selectedProviderPlan.id,
      meses: Number(this.providerPlanBillingCycle)
    };

    this.http.post(`${APP_API_BASE_URL}/suscripciones/crear-orden`, request)
      .subscribe({
        next: (res: any) => {
          this.providerPlanSubmitting = false;

          if (res?.approvalUrl) {
            window.location.href = res.approvalUrl;
            return;
          }

          this.providerAccessMessage = 'No se pudo obtener la URL de PayPal.';
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.providerPlanSubmitting = false;
          this.providerAccessMessage = err?.error?.message || 'No se pudo iniciar el pago con PayPal.';
          this.cdr.detectChanges();
        }
      });
  }

  private cargarPlanProveedorLocal(): void {
    const savedPlan = localStorage.getItem('provider_current_plan');

    if (savedPlan && this.providerPlans.some(plan => plan.id === Number(savedPlan))) {
      this.selectedProviderPlanId = Number(savedPlan);
    }
  }

  cargarEstadoSuscripcionProveedor(): void {
    const userId = this.getActiveUserId();

    if (!userId) {
      return;
    }

    this.http.get<any>(`${APP_API_BASE_URL}/suscripciones/estado/${userId}`, {
      headers: this.headers()
    }).subscribe({
      next: (res) => {
        const planId = Number(res?.idPlan || this.selectedProviderPlanId || 1);
        const estado = String(res?.estado || '').toUpperCase();
        const isActive = estado === 'ACTIVA' && res?.bloqueado !== true;
        const effectivePlanId = Number.isFinite(planId) && planId > 0 ? planId : 1;

        this.providerAccessBlocked = !isActive;
        this.providerAccessMessage = res?.mensaje || 'Tu suscripción necesita actualización.';
        this.selectedProviderPlanId = effectivePlanId;
        localStorage.setItem('provider_current_plan', String(this.selectedProviderPlanId));

        if (this.providerAccessBlocked) {
          this.plansModalOpen = true;
        } else if (this.isProviderDashboardRoute && !this.canAccessProviderDashboard) {
          this.router.navigate(['/app/provider/requests']);
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.providerAccessBlocked = false;
        this.providerAccessMessage = '';
      }
    });
  }

  private getActiveUserId(): number | null {
    const storageValue = localStorage.getItem('auth_user_id');

    if (storageValue) {
      const parsed = Number(storageValue);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    const userValue = this.usuario?.idUsuario ?? this.usuario?.id;

    if (typeof userValue === 'number' && userValue > 0) {
      return userValue;
    }

    return null;
  }

  private hidratarPagoPlanProveedor(): void {
    this.providerPlanPayment.payerName =
      this.providerPlanPayment.payerName ||
      this.nombreCompleto;

    this.providerPlanPayment.payerEmail =
      this.providerPlanPayment.payerEmail ||
      this.usuario?.correo ||
      '';

  }

  ngOnDestroy(): void {
    window.removeEventListener('profileUpdated', this.profileUpdatedHandler);
    window.removeEventListener('providerCountsRefresh', this.providerCountsRefreshHandler);
    window.removeEventListener('voiceOpenProviderPlans', this.voiceOpenProviderPlansHandler);
  }

  toggleMenuMovil(): void {
    this.menuMovilAbierto = !this.menuMovilAbierto;
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto = false;
  }

  get isAdmin(): boolean {
    return this.router.url.startsWith('/app/admin');
  }

  get isProvider(): boolean {
    return this.router.url.startsWith('/app/provider');
  }

  get isClient(): boolean {
    return !this.isAdmin && !this.isProvider;
  }

  get nombreCompleto(): string {

    const nombres = this.usuario?.nombres || '';
    const apellidos = this.usuario?.apellidos || '';

    return `${nombres} ${apellidos}`.trim();
  }

  get nombreRol(): string {

    const rol = (this.usuario?.rol || localStorage.getItem(APP_STORAGE_KEYS.role) || '').toUpperCase();

    if (rol === 'ADMIN') {
      return 'Administrador';
    }

    if (rol === 'PROVEEDOR') {
      return 'Proveedor';
    }

    return 'Cliente';
  }

  get panelActual(): string {

    if (this.isAdmin) {
      return 'Panel Administrativo';
    }

    if (this.isProvider) {
      return 'Panel Proveedor';
    }

    return 'Panel Cliente';
  }

  get fotoPerfil(): string {

    if (!this.usuario?.fotoPerfil) {
      return '';
    }

    const foto = String(this.usuario.fotoPerfil);

    if (foto.startsWith('data:')) {
      return foto;
    }

    const separator = foto.includes('?') ? '&' : '?';

    return `${foto}${separator}t=${this.fotoPerfilCacheBust}`;
  }

  get fotoPerfilValida(): boolean {

    return !!this.usuario?.fotoPerfil &&
           this.usuario.fotoPerfil !== 'null' &&
           this.usuario.fotoPerfil.trim() !== '';
  }

  get iniciales(): string {

    const nombres = this.usuario?.nombres || '';
    const apellidos = this.usuario?.apellidos || '';

    const n1 = nombres.charAt(0).toUpperCase();
    const a1 = apellidos.charAt(0).toUpperCase();

    return `${n1}${a1}`;
  }

  imagenError(): void {
    this.usuario.fotoPerfil = '';
    this.fotoPerfilCacheBust = Date.now();
    this.cdr.detectChanges();
  }

  ejecutarBusquedaGlobal(): void {
    const search = this.globalSearchTerm.trim();

    this.router.navigate(
      [APP_ROUTE_PATHS.rfqCatalog],
      search ? { queryParams: { search } } : { queryParams: {} }
    );
  }

  logout(): void {

    this.cerrarMenuMovil();
    this.themeService.resetToDefault();

    localStorage.removeItem(APP_STORAGE_KEYS.token);
    localStorage.removeItem(APP_STORAGE_KEYS.role);
    localStorage.removeItem(APP_STORAGE_KEYS.rfqCart);
    localStorage.removeItem(APP_STORAGE_KEYS.selectedProvider);
    localStorage.removeItem(APP_STORAGE_KEYS.currentSolicitudId);

    this.router.navigate([APP_ROUTE_PATHS.login], { replaceUrl: true });
  }

  private headers(): HttpHeaders {

    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

  cargarPerfil(): void {

    this.http.get<any>(
      `${APP_API_BASE_URL}/usuarios/perfil`,
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {

        this.usuario = res;
        this.fotoPerfilCacheBust = Date.now();

        if (this.isProvider) {
          this.cargarEstadoSuscripcionProveedor();
        }

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(err);
      }
    });
  }

  cargarEstadoApi(refresh = false): void {

  this.providerShellData.getProviderApi(refresh)
  .subscribe({

    next: (res) => {

      this.estadoApi =
        res.estadoConexion || 'Desconectada';

      this.cdr.detectChanges();
    },

    error: (err) => {

      console.error(
        'Error obteniendo estado API',
        err
      );

      this.estadoApi = 'Desconectada';
    }
  });
}

  cargarIndicadoresProveedor(refresh = false): void {
    forkJoin({
      solicitudes: this.providerShellData.getProviderRequests(refresh),
      pagos: this.providerShellData.getProviderPayments(refresh),
      entregas: this.providerShellData.getProviderDeliveries(refresh),
      reclamos: this.providerShellData.getProviderClaims(refresh)
    }).subscribe(({ solicitudes, pagos, entregas, reclamos }) => {
      this.providerRequestCount =
        (solicitudes || []).length;

      this.providerPaymentCount =
        (pagos || []).length;

      this.providerDeliveryCount =
        (entregas || []).length;

      this.providerClaimCount =
        (reclamos || []).length;

      this.cdr.detectChanges();
    });
  }
}





