import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClaimStatus, ProviderClaim } from './claim.model';
import { ProviderClaimsService } from './claims.service';

@Component({
  selector: 'app-provider-claims',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './claims.html',
  styleUrls: ['./claims.scss']
})
export class ProviderClaimsComponent implements OnInit {
  claims: ProviderClaim[] = [];
  filteredClaims: ProviderClaim[] = [];
  selectedClaim: ProviderClaim | null = null;

  searchTerm = '';
  estadoSeleccionado: ClaimStatus | '' = '';
  resolucion = '';
  accionSolicitud = 'MANTENER';
  codigoEntrega = '';
  guardando = false;
  cargando = false;
  errorMessage = '';
  evidenceZoom = 1;
  readonly minEvidenceZoom = 0.5;
  readonly maxEvidenceZoom = 2.5;

  constructor(
    private claimsService: ProviderClaimsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.recargarReclamos();
  }

  recargarReclamos(): void {
    this.cargando = true;
    this.claimsService.listarReclamos().subscribe({
      next: (data) => {
        const prioridad: Record<string, number> = {
          ABIERTO: 1,
          EN_REVISION: 2,
          RESUELTO: 3,
          RECHAZADO: 4
        };

        this.claims = (data || []).sort((a, b) => {
          const estadoA = prioridad[this.normalizar(a.estado)] || 99;
          const estadoB = prioridad[this.normalizar(b.estado)] || 99;

          if (estadoA !== estadoB) {
            return estadoA - estadoB;
          }

          return new Date(b.fechaCreacion || '').getTime() - new Date(a.fechaCreacion || '').getTime();
        });

        this.filtrarReclamos();
        const currentId = this.selectedClaim?.idReclamo;
        this.selectedClaim = this.filteredClaims.find(item => item.idReclamo === currentId) || this.filteredClaims[0] || null;
        this.resetForm();
        this.cargando = false;
        this.cdr.markForCheck();
        this.notifyProviderCountsRefresh();
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los reclamos.';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  filtrarReclamos(): void {
    const text = this.searchTerm.trim().toLowerCase();

    if (!text) {
      this.filteredClaims = [...this.claims];
      return;
    }

    this.filteredClaims = this.claims.filter(claim => [
      this.getClaimCode(claim),
      claim.idSolicitud?.toString(),
      claim.nombreEmpresa,
      claim.nombreCliente,
      claim.tipo,
      claim.estado,
      claim.descripcion
    ].some(value => (value || '').toString().toLowerCase().includes(text)));
  }

  seleccionarReclamo(claim: ProviderClaim): void {
    this.selectedClaim = claim;
    this.evidenceZoom = 1;
    this.resetForm();
  }

  actualizarEstado(): void {
    if (!this.selectedClaim || this.guardando) {
      return;
    }

    this.errorMessage = '';

    if (!this.estadoSeleccionado) {
      this.errorMessage = 'Debes seleccionar un estado.';
      return;
    }

    if ((this.estadoSeleccionado === 'RESUELTO' || this.estadoSeleccionado === 'RECHAZADO') && !this.resolucion.trim()) {
      this.errorMessage = 'Ingresa la resolución antes de cerrar el reclamo.';
      return;
    }

    if (this.debeSolicitarCodigoEntrega() && !this.codigoEntrega.trim()) {
      this.errorMessage = 'Debes ingresar el código de entrega.';
      return;
    }

    const accionesDisponibles = this.getAccionesDisponibles();
    const accionValida = accionesDisponibles.some(accion => accion.value === this.accionSolicitud);

    if (!accionValida) {
      this.errorMessage = 'Selecciona la acción que tomará la solicitud.';
      return;
    }

    this.guardando = true;
    this.claimsService.actualizarEstado(this.selectedClaim.idReclamo, {
      estado: this.estadoSeleccionado,
      resolucion: this.resolucion.trim(),
      accion: this.accionSolicitud,
      codigoEntrega: this.codigoEntrega.trim()
    }).subscribe({
      next: (claim) => {
        this.claims = this.claims.map(item => item.idReclamo === claim.idReclamo ? claim : item);
        this.filtrarReclamos();
        this.selectedClaim = claim;
        this.resetForm();
        this.guardando = false;
        this.cdr.markForCheck();
        this.notifyProviderCountsRefresh();
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se pudo actualizar el reclamo.';
        this.guardando = false;
        this.cdr.markForCheck();
      }
    });
  }

  trackOptionValue(_index: number, option: { value: string }): string {
    return option.value;
  }

  getEstadosDisponibles(): { value: ClaimStatus; label: string }[] {
    if (!this.selectedClaim) {
      return [];
    }

    switch (this.normalizar(this.selectedClaim.estado)) {
      case 'ABIERTO':
        return [{ value: 'EN_REVISION', label: 'En revisión' }];
      case 'EN_REVISION':
        return [
          { value: 'RESUELTO', label: 'Resuelto' },
          { value: 'RECHAZADO', label: 'Rechazado' }
        ];
      default:
        return [];
    }
  }

  getAccionesDisponibles(): { value: string; label: string }[] {
    if (!this.selectedClaim) {
      return [];
    }

    switch (this.normalizar(this.selectedClaim.tipo)) {
      case 'CANCELACION':
        return [
          { value: 'MANTENER', label: 'Mantener el estado actual' },
          { value: 'AVANZAR', label: 'Avanzar al siguiente estado' },
          { value: 'RETROCEDER', label: 'Retroceder al estado anterior' },
          { value: 'CANCELAR', label: 'Cancelar la solicitud' }
        ];
      case 'ENTREGA_INCOMPLETA':
        return [
          { value: 'MANTENER', label: 'Mantener el estado actual' },
          { value: 'RETROCEDER', label: 'Retroceder al estado anterior' },
          { value: 'AVANZAR', label: 'Avanzar al siguiente estado' },
          { value: 'CANCELAR', label: 'Cancelar la solicitud' }
        ];
      default:
        return [
          { value: 'MANTENER', label: 'Mantener el estado actual' },
          { value: 'RETROCEDER', label: 'Retroceder al estado anterior' },
          { value: 'AVANZAR', label: 'Avanzar al siguiente estado' },
          { value: 'CANCELAR', label: 'Cancelar la solicitud' }
        ];
    }
  }

  onEstadoSeleccionadoCambio(): void {
    if (this.estadoSeleccionado !== 'RESUELTO' && this.estadoSeleccionado !== 'RECHAZADO') {
      this.accionSolicitud = 'MANTENER';
      this.codigoEntrega = '';
      return;
    }

    const accionesDisponibles = this.getAccionesDisponibles();
    const tieneAccionValida = accionesDisponibles.some(accion => accion.value === this.accionSolicitud);

    if (!tieneAccionValida) {
      this.accionSolicitud = 'MANTENER';
    }
  }

  debeSolicitarCodigoEntrega(): boolean {
    return this.estadoSeleccionado === 'RESUELTO' || this.estadoSeleccionado === 'RECHAZADO'
      ? this.accionSolicitud === 'AVANZAR' && this.normalizar(this.selectedClaim?.estadoSolicitud) === 'EN_CAMINO'
      : false;
  }

  getClaimCode(claim: ProviderClaim | null | undefined): string {
    if (!claim) {
      return '';
    }

    const year = new Date(claim.fechaCreacion || new Date()).getFullYear();
    return `RC-${year}-${String(claim.idReclamo).padStart(4, '0')}`;
  }

  getOrderCode(claim: ProviderClaim | null | undefined): string {
    if (!claim?.idSolicitud) {
      return '';
    }

    const year = new Date(claim.fechaCreacion || new Date()).getFullYear();
    return `OR-${year}-${String(claim.idSolicitud).padStart(4, '0')}`;
  }

  getFecha(date?: string): string {
    return date ? new Date(date).toLocaleDateString('es-PE') : '';
  }

  getHora(date?: string): string {
    return date ? new Date(date).toLocaleTimeString('es-PE') : '';
  }

  getTipoLabel(tipo?: string): string {
    const labels: Record<string, string> = {
      NO_ENTREGA: 'No entrega',
      PRODUCTO_DANADO: 'Producto dañado',
      PRODUCTO_INCORRECTO: 'Producto incorrecto',
      DEMORA: 'Demora',
      CANCELACION: 'Cancelación',
      ENTREGA_INCOMPLETA: 'Entrega incompleta'
    };

    return labels[this.normalizar(tipo)] || tipo || 'Reclamo';
  }

  getEstadoClass(estado?: string): string {
    return this.normalizar(estado).toLowerCase().replace('_', '-');
  }

  getEvidenceUrl(claim: ProviderClaim | null | undefined): string {
    if (!claim) {
      return '';
    }

    const value = (claim as ProviderClaim & Record<string, string | undefined>)[
      'evidenciaUrl'
    ] || (claim as ProviderClaim & Record<string, string | undefined>)[
      'evidencia_url'
    ] || (claim as ProviderClaim & Record<string, string | undefined>)[
      'adjuntoUrl'
    ] || (claim as ProviderClaim & Record<string, string | undefined>)[
      'archivoUrl'
    ];

    return value || '';
  }

  getEvidenceType(url: string): 'image' | 'pdf' | 'other' {
    if (!url) {
      return 'other';
    }

    const normalized = url.toLowerCase();

    if (normalized.match(/\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/)) {
      return 'image';
    }

    if (normalized.match(/\.pdf(\?.*)?$/)) {
      return 'pdf';
    }

    return 'other';
  }

  zoomInEvidence(): void {
    this.evidenceZoom = Math.min(this.maxEvidenceZoom, Number((this.evidenceZoom + 0.25).toFixed(2)));
  }

  zoomOutEvidence(): void {
    this.evidenceZoom = Math.max(this.minEvidenceZoom, Number((this.evidenceZoom - 0.25).toFixed(2)));
  }

  downloadEvidence(claim: ProviderClaim | null | undefined): void {
    const url = this.getEvidenceUrl(claim);

    if (!url) {
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.download = `evidencia-reclamo-${claim?.idReclamo || 'adjunto'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private normalizar(value?: string): string {
    return (value || '').toString().trim().toUpperCase().replace(/\s+/g, '_');
  }

  private resetForm(): void {
    this.estadoSeleccionado = '';
    this.resolucion = '';
    this.accionSolicitud = 'MANTENER';
    this.codigoEntrega = '';
    this.errorMessage = '';
  }

  private notifyProviderCountsRefresh(): void {
    window.dispatchEvent(new Event('providerCountsRefresh'));
  }
}
