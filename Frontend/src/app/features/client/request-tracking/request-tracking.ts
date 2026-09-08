// Backend touchpoint: request tracking timeline, cancel action and payment handoff.
import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { APP_API_BASE_URL, APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';
import { DelayClaim, DelayClaimsService } from '../../../core/services/delay-claims.service';
import { ClaimType, getAvailableClaimTypes, normalizeClaimState } from './claim-type-utils';

@Component({
  selector: 'app-request-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './request-tracking.html',
  styleUrl: './request-tracking.scss'
})
export class RequestTrackingComponent implements OnInit {

  tracking: any = null;
  steps: any[] = [];
  loading = true;
  errorMessage = '';
  claimModalOpen = false;
  claimDescription = '';
  claimPromisedDate = '';
  claimError = '';
  currentClaim: DelayClaim | null = null;
  selectedEvidence?: File;
  claimSubmitting = false;
  claimType: ClaimType = 'DEMORA';
  availableClaimTypes: ClaimType[] = ['DEMORA'];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private delayClaimsService: DelayClaimsService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.cargarTracking(id);
      return;
    }

    this.errorMessage = 'No se encontro el identificador de la solicitud.';
    this.loading = false;
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

  onEvidenceSelected(event: Event): void {

  const input = event.target as HTMLInputElement;

  if (!input.files?.length) {
    this.selectedEvidence = undefined;
    return;
  }

  this.selectedEvidence = input.files[0];
}

  cargarTracking(id: string): void {

    this.loading = true;
    this.errorMessage = '';

    this.http.get<any>(
      `${APP_API_BASE_URL}/solicitudes/${id}/tracking`,
      { headers: this.headers() }
    ).subscribe({

      next: (res) => {

        console.log('TRACKING:', res);

        this.tracking = res;
        
        this.claimPromisedDate = this.getDefaultPromisedDateInput();

        localStorage.setItem(
          APP_STORAGE_KEYS.currentSolicitudId,
          String(res.idSolicitud)
        );

        this.steps = (res.timeline || []).map((t: any, i: number) => ({
          title: this.mapEstado(t.estado),
          description: t.descripcion,
          date: t.fecha,
          status: i === res.timeline.length - 1
            ? 'active'
            : 'done'
        }));

        this.availableClaimTypes = getAvailableClaimTypes(res);
        if (!this.availableClaimTypes.includes(this.claimType)) {
          this.claimType = this.availableClaimTypes[0] || 'DEMORA';
        }

        this.loading = false;

        this.cdr.detectChanges();

        if (this.route.snapshot.queryParamMap.get('claim') === '1' && this.canCreateDelayClaim()) {
          this.abrirReclamoDemora();
          this.cdr.detectChanges();
        }
      },

      error: (err) => {
        console.error(err);
        this.errorMessage = this.getTrackingErrorMessage(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private getTrackingErrorMessage(err: any): string {
    if (err?.status === 400) {
      return 'No se pudo cargar el tracking de esta solicitud. Verifica que el ID exista y pertenezca a tu cuenta.';
    }

    if (err?.status === 401 || err?.status === 403) {
      return 'Tu sesion no tiene permisos para ver el tracking de esta solicitud.';
    }

    return 'No se pudo cargar el tracking en este momento.';
  }

  irAPago(): void {

    if (!this.tracking?.idSolicitud) {
      return;
    }

    localStorage.setItem(
      APP_STORAGE_KEYS.currentSolicitudId,
      String(this.tracking.idSolicitud)
    );

    this.router.navigate([APP_ROUTE_PATHS.rfqPayment]);
  }

  cancelarSolicitud(): void {

    const id = this.tracking.idSolicitud;

    this.http.put(
      `${APP_API_BASE_URL}/solicitudes/${id}/cancelar`,
      {},
      { headers: this.headers() }
    ).subscribe({

      next: (res) => {

        console.log('CANCELADO:', res);

        this.router.navigate([APP_ROUTE_PATHS.clientRequests]);
      },

      error: (err) => {

        console.error('ERROR CANCELAR:', err);

        alert('Error al cancelar');
      }
    });
  }

  abrirReclamoDemora(): void {
    if (this.currentClaim) {
      return;
    }

    this.availableClaimTypes = getAvailableClaimTypes(this.tracking);
    this.claimType = this.availableClaimTypes.includes(this.claimType)
      ? this.claimType
      : (this.availableClaimTypes[0] || 'DEMORA');
    this.claimError = '';
    this.claimDescription = this.getDefaultClaimDescription();
    this.claimPromisedDate = this.getDefaultPromisedDateInput();
    this.claimModalOpen = true;
  }

  cerrarReclamoDemora(): void {
    if (this.claimSubmitting) {
      return;
    }

    this.claimModalOpen = false;
    this.claimError = '';
  }

  guardarReclamoDemora(): void {
    if (this.claimSubmitting) {
      return;
    }

    if (!this.tracking?.idSolicitud) {
      return;
    }

    const promisedDate = this.getClaimPromisedDate();
    const description = this.claimDescription.trim();

    if (this.claimType === 'DEMORA' && !promisedDate) {
      this.claimError = 'Indica la fecha prometida por el proveedor.';
      return;
    }

    if (!description) {
      this.claimError = 'Describe brevemente el reclamo.';
      return;
    }

    const payload = {
      idSolicitud: Number(this.tracking.idSolicitud),
      idProveedor: this.tracking?.idProveedor ?? null,
      proveedor: this.tracking?.proveedor || 'Proveedor',
      empresaCliente: this.tracking?.empresaCompradora?.razonSocial || 'Cliente',
      orderCode: this.getRequestCode(),
      motivo: this.claimType,
      descripcion: description,
      fechaPrometida: promisedDate?.toISOString(),
      diasDemora: this.getDelayDays(promisedDate)
    };

    this.claimSubmitting = true;
    this.claimError = '';

    this.delayClaimsService.save(payload, this.selectedEvidence).subscribe({
      next: (res) => {
        console.log('Reclamo registrado', res);

        this.currentClaim = {
          ...payload,
          estado: 'PENDIENTE_PROVEEDOR',
          createdAt: new Date().toISOString()
        };
        this.claimSubmitting = false;
        this.claimModalOpen = false;
        this.claimError = '';
        this.selectedEvidence = undefined;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.claimSubmitting = false;
        this.claimError = err?.error?.message || 'No se pudo registrar el reclamo. Verifica si ya existe uno activo para este tipo.';
        this.cdr.detectChanges();
      }
    });
  }

  getRequestCode(): string {
    return `RFQ-2026-${this.tracking?.idSolicitud || ''}`;
  }

  getPromisedDate(): Date | null {
    const raw =
      this.tracking?.fechaLimiteEntrega ||
      this.tracking?.fechaEntregaPrometida ||
      this.tracking?.fechaEntregaEstimada ||
      this.tracking?.fechaPrometida;

    if (raw) {
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const baseDate =
      this.tracking?.fechaCreacion ||
      this.steps?.[0]?.date ||
      this.tracking?.timeline?.[0]?.fecha;
    const deliveryDays = Number(
      this.tracking?.tiempoEntregaDias ??
      this.tracking?.tiempoEntregaPromedio ??
      0
    );

    if (!baseDate || !deliveryDays) {
      return null;
    }

    const base = new Date(baseDate);

    if (Number.isNaN(base.getTime())) {
      return null;
    }

    base.setDate(base.getDate() + deliveryDays);
    return base;
  }

  getDelayDays(date = this.getPromisedDate()): number {
    if (!date) {
      return 0;
    }

    const end = this.isDelivered()
      ? new Date(this.tracking?.fechaEntrega || Date.now())
      : new Date();

    const ms = end.getTime() - date.getTime();

    if (ms <= 0) {
      return 0;
    }

    return Math.max(1, Math.floor(ms / 86400000));
  }

  canCreateDelayClaim(): boolean {
    if (!this.tracking || this.currentClaim) {
      return false;
    }

    const available = getAvailableClaimTypes(this.tracking);
    return available.length > 0;
  }

  getDelayClaimHint(): string {
    const estado = normalizeClaimState(this.tracking?.estado);
    const available = getAvailableClaimTypes(this.tracking);

    if (available.includes('CANCELACION')) {
      return 'Puedes registrar un reclamo por la cancelación de la orden y dejar constancia del motivo.';
    }

    if (available.includes('ENTREGA_INCOMPLETA')) {
      return 'Puedes reportar que la entrega no se realizó como esperabas y decidir si se mantiene el estado o se devuelve a EN PREPARACION.';
    }

    if (available.includes('DEMORA')) {
      return 'Se puede abrir un reclamo por demora cuando la entrega supera el tiempo prometido.';
    }

    switch (estado) {
      case 'CANCELADA':
        return 'Puedes registrar un reclamo por la cancelación de la orden y dejar constancia del motivo.';
      case 'ENTREGADA':
      case 'COMPLETADA':
        return 'Puedes reportar que la entrega no se realizó como esperabas y decidir si se mantiene el estado o se devuelve a EN PREPARACION.';
      default:
        return 'Solo se permite generar reclamos cuando la orden está cancelada, completada o con demora en la entrega.';
    }
  }

  formatClaimDate(value?: string): string {
    if (!value) {
      return 'Sin fecha';
    }

    return new Date(value).toLocaleDateString('es-PE');
  }

  getClaimPromisedDate(): Date | null {
    if (this.claimPromisedDate) {
      const parsed = new Date(`${this.claimPromisedDate}T23:59:59`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return this.getPromisedDate();
  }

  private getDefaultPromisedDateInput(): string {
    const promisedDate = this.getPromisedDate();

    if (!promisedDate) {
      return '';
    }

    return promisedDate.toISOString().slice(0, 10);
  }

  private getDefaultClaimDescription(): string {
    const days = this.getDelayDays();
    const suffix = days > 0
      ? ` La demora calculada es de ${days} dia${days === 1 ? '' : 's'}.`
      : '';

    return `Solicito revision por demora en la entrega de la solicitud ${this.getRequestCode()}.${suffix}`;
  }

  private isDelivered(): boolean {
    const estado = this.normalizarEstado(this.tracking?.estado);
    return estado === 'ENTREGADA' || estado === 'COMPLETADA';
  }

  private isFinalStatus(): boolean {
    const estado = this.normalizarEstado(this.tracking?.estado);
    return ['ENTREGADA', 'COMPLETADA', 'CANCELADA', 'RECHAZADA'].includes(estado);
  }

  private normalizarEstado(estado: string): string {
    return normalizeClaimState(estado);
  }

  mapEstado(estado: string): string {

    const map: any = {
      CREADA: 'Creada',
      PAGO_PENDIENTE: 'Pedido en revisión',
      PEDIDO_APROBADO: "Pedido aprobado",
      PAGO_VALIDANDO: 'Validando pago',
      PAGADA : "Pagado",
      EN_CAMINO: 'En camino',
      ENTREGADA: 'Entregado',
      CANCELADA: 'Cancelada'
    };

    return map[this.normalizarEstado(estado)] || estado;
  }

  getEstadoTexto(): string {

    if (!this.tracking) {
      return '';
    }

    return this.mapEstado(this.tracking.estado);
  }

  esPedidoAprobado(): boolean {
    return this.normalizarEstado(this.tracking?.estado) === 'PEDIDO_APROBADO';
  }

   esPosibleCancelar(): boolean {
    return this.normalizarEstado(this.tracking?.estado) === 'PAGO_PENDIENTE';
  }
  esEnCamino(): boolean {
    return  this.tracking?.estado === 'En camino';
  }
}
