import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ProviderRequestsService } from './provider-requests.service';

@Component({
  selector: 'app-provider-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './requests.html',
  styleUrls: ['./requests.scss']
})
export class ProviderRequestsComponent implements OnInit {

  requests: any[] = [];
  filteredRequests: any[] = [];
  searchTerm = '';
  loading = true;
  errorMessage = '';
  processingRequestId: number | null = null;
  processingAction: 'APROBAR' | 'RECHAZAR' | null = null;

  selectedRequest: any | null = null;
  productos: any[] = [];
  detailViewOpen = false;
  private listScrollPosition = 0;

  constructor(
    private requestService: ProviderRequestsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  private normalizarEstado(estado: string): string {
    return (estado || '')
      .toString()
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  loadRequests(): void {

    this.loading = true;
    this.errorMessage = '';

    this.requestService.listarSolicitudes()
      .subscribe({

        next: (data) => {

          const estadosPermitidos = [
            'PAGO_PENDIENTE',
            'PAGO_VALIDANDO',
            'PEDIDO_APROBADO',
            'CANCELADA'
          ];

          const prioridad: Record<string, number> = {
            PAGO_PENDIENTE: 1,
            PAGO_VALIDANDO: 2,
            PEDIDO_APROBADO: 3,
            CANCELADA: 4
          };

          this.requests = (data || [])
            .filter((request: any) =>
              estadosPermitidos.includes(
                this.normalizarEstado(request.estado)
              )
            )
            .sort((a: any, b: any) => {

              const estadoA = this.normalizarEstado(a.estado);
              const estadoB = this.normalizarEstado(b.estado);

              if (prioridad[estadoA] !== prioridad[estadoB]) {
                return prioridad[estadoA] - prioridad[estadoB];
              }

              return new Date(a.fechaCreacion).getTime()   -  new Date(b.fechaCreacion).getTime()
                ;
            });

          this.filterRequests();

          if (this.filteredRequests.length > 0) {

            const currentId = this.selectedRequest?.idSolicitud;

            this.selectRequest(
              this.filteredRequests.find(
                request => request.idSolicitud === currentId
              ) || this.filteredRequests[0],
              false
            );

          } else {

            this.selectRequest(null, false);

          }

          this.loading = false;
          this.cdr.markForCheck();

          this.notifyProviderCountsRefresh();
          this.cdr.markForCheck();

        },

        error: () => {

          this.requests = [];
          this.filteredRequests = [];
          this.selectRequest(null, false);

          this.errorMessage =
            'No se pudieron cargar las solicitudes.';

          this.loading = false;
          this.cdr.markForCheck();

          this.notifyProviderCountsRefresh();
          this.cdr.markForCheck();

        }

      });

  }

  filterRequests(): void {

    const text = this.searchTerm.trim().toLowerCase();

    if (!text) {

      this.filteredRequests = [...this.requests];

      return;

    }

    this.filteredRequests = this.requests.filter(request => [

      this.getRfQCode(request),
      request?.nombreEmpresa,
      request?.nombreCliente,
      request?.correoCliente,
      request?.estado,
      request?.idSolicitud?.toString()

    ].some(value => (value || '').toLowerCase().includes(text)));

  }

  selectRequest(request: any | null, openDetail = true): void {

    this.selectedRequest = request;
    this.productos = request?.detalles ?? [];

    if (request && openDetail) {
      this.listScrollPosition = window.scrollY;
      this.detailViewOpen = true;
      this.scrollPageTo(0);
    }

  }

  showRequestList(): void {
    this.detailViewOpen = false;
    this.scrollPageTo(this.listScrollPosition);
  }

  private scrollPageTo(top: number): void {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top, behavior: 'auto' });
    });
  }

  isProcessingSelectedRequest(): boolean {

    return !!this.selectedRequest &&
      this.processingRequestId === this.selectedRequest.idSolicitud;

  }

  canProcessSelectedRequest(): boolean {
    return !!this.selectedRequest &&
      this.normalizarEstado(this.selectedRequest.estado) === 'PAGO_PENDIENTE' &&
      !this.isProcessingSelectedRequest();
  }

  getRfQCode(request: any): string {

    if (!request) {

      return '';

    }

    const year = new Date(
      request.fechaCreacion || new Date()
    ).getFullYear();

    const id = String(request.idSolicitud).padStart(4, '0');

    return `RFQ-${year}-${id}`;

  }

  getFecha(date: string): string {

    if (!date) {

      return '';

    }

    return new Date(date).toLocaleDateString('es-PE');

  }

  getHora(date: string): string {

    if (!date) {

      return '';

    }

    return new Date(date).toLocaleTimeString('es-PE');

  }

  getFechaCompleta(date?: string): string {

    if (!date) {

      return '';

    }

    const fecha = new Date(date);

    const fechaTexto = fecha.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long'
    });

    const horaTexto = fecha.toLocaleTimeString('es-PE', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `Recibida el ${fechaTexto} a las ${horaTexto}`;

  }

  aprobarPedido(): void {

    if (!this.canProcessSelectedRequest() || this.processingRequestId) {

      return;

    }

    const requestId = this.selectedRequest.idSolicitud;

    this.processingRequestId = requestId;
    this.processingAction = 'APROBAR';
    this.errorMessage = '';

    this.requestService
      .aprobarPedido(requestId)
      .subscribe({

        next: () => {

          this.updateRequestState(requestId, 'PEDIDO_APROBADO');
          this.processingRequestId = null;
          this.processingAction = null;
          this.cdr.markForCheck();
          this.loadRequests();

        },

        error: () => {

          this.processingRequestId = null;
          this.processingAction = null;
          this.cdr.markForCheck();
          this.errorMessage =
            'Error al aprobar pedido.';

        }

      });

  }

  async rechazarPedido(): Promise<void> {

    if (!this.canProcessSelectedRequest() || this.processingRequestId) {

      return;

    }

    const result = await Swal.fire({
      title: 'Rechazar pedido',
      text: 'Ingrese el motivo por el cual rechaza la orden.',
      input: 'textarea',
      inputAttributes: {
        maxlength: '240'
      },
      showCancelButton: true,
      confirmButtonText: 'Confirmar rechazo',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false
    } as any);

    const motivo = String(result?.value || '').trim();

    if (!result?.isConfirmed || !motivo) {

      return;

    }

    const requestId = this.selectedRequest.idSolicitud;

    this.processingRequestId = requestId;
    this.processingAction = 'RECHAZAR';
    this.errorMessage = '';

    this.requestService
      .rechazarPedido(
        requestId,
        motivo
      )
      .subscribe({

        next: async () => {

          this.updateRequestState(requestId, 'CANCELADA');
          this.processingRequestId = null;
          this.processingAction = null;
          this.cdr.markForCheck();
          await Swal.fire({
            icon: 'success',
            title: 'Pedido rechazado',
            text: 'La orden quedó cancelada correctamente.'
          });
          this.loadRequests();

        },

        error: () => {

          this.processingRequestId = null;
          this.processingAction = null;
          this.cdr.markForCheck();
          this.errorMessage =
            'Error al rechazar pedido.';

        }

      });

  }

  private updateRequestState(requestId: number, estado: string): void {
    this.requests = this.requests.map(request =>
      request?.idSolicitud === requestId ? { ...request, estado } : request
    );
    this.filteredRequests = this.filteredRequests.map(request =>
      request?.idSolicitud === requestId ? { ...request, estado } : request
    );

    if (this.selectedRequest?.idSolicitud === requestId) {
      this.selectedRequest = { ...this.selectedRequest, estado };
    }
  }

  private notifyProviderCountsRefresh(): void {

    window.dispatchEvent(
      new Event('providerCountsRefresh')
    );

  }

}
