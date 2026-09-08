// Backend touchpoint: request history mapping and status filters for closed RFQs.
import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class HistoryComponent implements OnInit {

  history: any[] = [];
  historyOriginal: any[] = [];

  filtroActivo = 'TODOS';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

  cargarHistorial(): void {

    this.http.get<any[]>(
      `${APP_API_BASE_URL}/solicitudes/mis-solicitudes/historial`,
      { headers: this.headers() }
    )
    .subscribe({

      next: (res) => {

        this.historyOriginal = res.map(s => ({

          idSolicitud: s.idSolicitud,

          code: `RFQ-2026-${s.idSolicitud.toString().padStart(4, '0')}`,

          provider: s.nombreProveedor,

          description: s.descripcionEstado,

          amount: `S/ ${Number(s.total).toLocaleString('es-PE', {
            minimumFractionDigits: 2
          })}`,

          createdDate: new Date(s.fechaCreacion)
            .toLocaleDateString('es-PE', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),

          updatedDate: new Date(s.fechaActualizacionEstado)
            .toLocaleDateString('es-PE', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),

          status: s.estado
        }));

        this.history = [...this.historyOriginal];

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Error al cargar historial:', err);
      }
    });
  }

  filtrar(tipo: string): void {

    this.filtroActivo = tipo;

    if (tipo === 'TODOS') {
      this.history = [...this.historyOriginal];
      return;
    }

    if (tipo === 'COMPLETADOS') {

      this.history = this.historyOriginal.filter(h =>
        h.status === 'Entregado' ||
        h.status === 'Completado' ||
        h.status === 'Completada'
      );

      return;
    }

    if (tipo === 'CANCELADOS') {

      this.history = this.historyOriginal.filter(h =>
        h.status === 'Cancelada'
      );
    }
  }

  verTracking(item: any): void {
    if (!item?.idSolicitud) {
      return;
    }

    this.router.navigate(['/app/requests/tracking', item.idSolicitud]);
  }

  generarReclamo(item: any): void {
    if (!item?.idSolicitud) {
      return;
    }

    this.router.navigate(
      ['/app/requests/tracking', item.idSolicitud],
      { queryParams: { claim: 1 } }
    );
  }
}
