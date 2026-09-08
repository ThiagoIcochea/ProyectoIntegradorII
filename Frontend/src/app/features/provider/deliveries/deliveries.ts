import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DeliveriesService } from './deliveries.service';
import { DeliveryDetail } from './delivery-detail.model';
import { DeliveryRequest } from './delivery.model';
import { TrackingStep } from './tracking-step.model';
import { DelayClaim, DelayClaimsService } from '../../../core/services/delay-claims.service';

@Component({
  selector: 'app-provider-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deliveries.html',
  styleUrls: ['./deliveries.scss']
})
export class ProviderDeliveriesComponent implements OnInit, OnDestroy {
  deliveries$: Observable<DeliveryRequest[]> = of([]);
  tracking$: Observable<TrackingStep[]> = of([]);
  details$: Observable<DeliveryDetail[]> = of([]);

  deliveries: DeliveryRequest[] = [];
  filteredDeliveries: DeliveryRequest[] = [];
  selectedRequest: DeliveryRequest | null = null;

  searchTerm = '';
  estadoSeleccionado = '';
  codigoEntrega = '';
  guardando = false;
  errorMessage = '';
  delayClaims: DelayClaim[] = [];
  private delayClaimsUpdatedHandler = () => {
    this.cargarReclamosLocales();
  };

  constructor(
    private deliveriesService: DeliveriesService,
    private delayClaimsService: DelayClaimsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    window.addEventListener('deliveryDelayClaimsUpdated', this.delayClaimsUpdatedHandler);
    window.addEventListener('storage', this.delayClaimsUpdatedHandler);
    this.cargarReclamosLocales();
    this.recargarSolicitudes();
  }

  ngOnDestroy(): void {
    window.removeEventListener('deliveryDelayClaimsUpdated', this.delayClaimsUpdatedHandler);
    window.removeEventListener('storage', this.delayClaimsUpdatedHandler);
  }

recargarSolicitudes(): void {
    this.deliveriesService
    .listarSolicitudesEntrega()
    .subscribe({

      next: (data) => {

        console.log("Datos recibidos:", data);

        const prioridad: Record<string, number> = {
  PAGADA: 1,
  EN_PREPARACION: 2,
  EN_CAMINO: 3,
  ENTREGADA: 4
};

this.deliveries = (data || [])
  .filter((item: any) =>
    [
      'PAGADA',
      'EN_PREPARACION',
      'EN_CAMINO',
      'ENTREGADA'
    ].includes(
      (item.estado || '')
        .toString()
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_')
    )
  )
  .sort((a: any, b: any) => {

    const estadoA = (a.estado || '')
      .toString()
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');

    const estadoB = (b.estado || '')
      .toString()
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');

  
    if (prioridad[estadoA] !== prioridad[estadoB]) {
      return prioridad[estadoA] - prioridad[estadoB];
    }

    
    const fechaA = new Date(
      a.fechaCreacion ||
      a.fechaPago ||
      a.fechaRegistro ||
      a.fecha
    ).getTime();

    const fechaB = new Date(
      b.fechaCreacion ||
      b.fechaPago ||
      b.fechaRegistro ||
      b.fecha
    ).getTime();

    return fechaA - fechaB;
  });

        this.filtrarEntregas();
        this.cdr.markForCheck();

        if (this.filteredDeliveries.length > 0) {

          const currentId = this.selectedRequest?.idSolicitud;

          this.seleccionarSolicitud(

            this.filteredDeliveries.find(
              item => item.idSolicitud === currentId
            ) || this.filteredDeliveries[0]

          );

        } else {

          this.selectedRequest = null;

          this.tracking$ = of([]);

          this.details$ = of([]);

        }

        this.cdr.markForCheck();

      },

      error: (err) => {

        this.errorMessage = "No se pudieron cargar las entregas.";
        this.cdr.markForCheck();

        this.errorMessage = 'No se pudieron cargar las entregas.';
        this.cdr.markForCheck();

      }

    });

}

  filtrarEntregas(): void {
    const text = this.searchTerm.trim().toLowerCase();

    if (!text) {
      this.filteredDeliveries = [...this.deliveries];
      return;
    }

    this.filteredDeliveries = this.deliveries.filter(order => [
      this.getOrCode(order),
      order.nombreEmpresa,
      order.nombreCliente,
      order.estado,
      order.idSolicitud?.toString(),
      order.direccionEnvio
    ].some(value => (value || '').toLowerCase().includes(text)));
  }

  seleccionarSolicitud(solicitud: DeliveryRequest): void {
    this.cargarReclamosLocales();
    this.selectedRequest = solicitud;
    this.estadoSeleccionado = '';
    this.codigoEntrega = '';
    this.cargarTracking(solicitud.idSolicitud);
    this.cargarDetalles(solicitud.idSolicitud);
  }

  cargarTracking(idSolicitud: number): void {
    this.tracking$ = this.deliveriesService.listarTrackingSolicitud(idSolicitud);
  }

  cargarDetalles(idSolicitud: number): void {
    this.details$ = this.deliveriesService.listarDetallesEntrega(idSolicitud);
  }

  actualizarTracking(): void {
    if (this.guardando || !this.selectedRequest) {
      return;
    }

    this.errorMessage = '';

    if (!this.estadoSeleccionado) {
      this.errorMessage = 'Debes seleccionar un estado.';
      return;
    }

    if (this.estadoSeleccionado === 'ENTREGADA' && !this.codigoEntrega.trim()) {
      this.errorMessage = 'Debes ingresar el codigo de entrega.';
      return;
    }

    this.guardando = true;

    this.deliveriesService
      .actualizarEstado(
        this.selectedRequest.idSolicitud,
        this.estadoSeleccionado,
        this.codigoEntrega.trim()
      )
      .subscribe({
        next: () => {
          const idSolicitud = this.selectedRequest?.idSolicitud;

          this.estadoSeleccionado = '';
          this.codigoEntrega = '';
          this.guardando = false;
          this.cdr.markForCheck();

          if (idSolicitud) {
            this.cargarTracking(idSolicitud);
            this.cargarDetalles(idSolicitud);
          }

          this.recargarSolicitudes();
          this.notifyProviderCountsRefresh();
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Error al actualizar estado.';
          this.guardando = false;
          this.cdr.markForCheck();
        }
      });
  }

  trackOptionValue(_index: number, option: { value: string }): string {
    return option.value;
  }

  getEstadosDisponibles(): { value: string; label: string }[] {
    if (!this.selectedRequest) {
      return [];
    }

    switch (this.selectedRequest.estado) {
      case 'PAGADA':
        return [{ value: 'EN_PREPARACION', label: 'En preparacion' }];
      case 'EN_PREPARACION':
        return [{ value: 'EN_CAMINO', label: 'En camino' }];
      case 'EN_CAMINO':
        return [{ value: 'ENTREGADA', label: 'Entregado' }];
      default:
        return [];
    }
  }

  getFecha(date?: string): string {
    if (!date) {
      return '';
    }

    return new Date(date).toLocaleDateString('es-PE');
  }

  getHora(date?: string): string {
    if (!date) {
      return '';
    }

    return new Date(date).toLocaleTimeString('es-PE');
  }

  getOrCode(deliverie: any): string {
    if (!deliverie) {
      return '';
    }

    const fecha = deliverie.fechaCreacion || deliverie.fechaPago || new Date();
    const year = new Date(fecha).getFullYear();
    const id = String(deliverie.idSolicitud).padStart(4, '0');

    return `OR-${year}-${id}`;
  }

  getClaimForOrder(order: DeliveryRequest | null | undefined): DelayClaim | null {
    if (!order?.idSolicitud) {
      return null;
    }

    return this.delayClaims.find(claim => Number(claim.idSolicitud) === Number(order.idSolicitud)) || null;
  }

  hasDelayClaim(order: DeliveryRequest | null | undefined): boolean {
    return !!this.getClaimForOrder(order);
  }

  get selectedDelayClaim(): DelayClaim | null {
    return this.getClaimForOrder(this.selectedRequest);
  }

  formatClaimDate(value?: string): string {
    if (!value) {
      return '';
    }

    return new Date(value).toLocaleDateString('es-PE');
  }

  private cargarReclamosLocales(): void {
    this.delayClaims = /* this.delayClaimsService.getAll() */ [];
  }

  private notifyProviderCountsRefresh(): void {
    window.dispatchEvent(new Event('providerCountsRefresh'));
  }
}
