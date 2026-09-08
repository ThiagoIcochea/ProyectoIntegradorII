// Backend touchpoint: open requests list and summary counters for active RFQs.
import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './requests.html',
  styleUrl: './requests.scss'
})
export class RequestsComponent implements OnInit {

  requests: any[] = [];
  loading = true;
  readonly skeletonRows = Array.from({ length: 4 });

  summary = {
    activas: 0,
    preparacion: 0,
    camino: 0,
    entregadas: 0
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

  cargarSolicitudes(): void {
    this.loading = true;

    this.http.get<any[]>(
      `${APP_API_BASE_URL}/solicitudes/mis-solicitudes`,
      { headers: this.headers() }
    )
    .subscribe({

      next: (res) => {

        const filtradas = res.filter(s =>
          !['Cancelada', 'Entregado', 'Completada', 'Completado'].includes(s.estado)
        );

        this.requests = filtradas.map(s => ({
          id: s.idSolicitud,

          code: `RFQ-2026-${s.idSolicitud.toString().padStart(4, '0')}`,

          provider: s.nombreProveedor,

          amount: `S/ ${Number(s.total).toLocaleString('es-PE', {
            minimumFractionDigits: 2
          })}`,

          date: new Date(s.fechaCreacion).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),

          status: s.estado=== 'Pago pendiente'? 'Pedido en revisión': s.estado,
          statusClass: this.mapStatusClass(s.estado),
          rawStatus: s.estado
        }));

        this.calcularResumen();
        this.loading = false;
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private mapStatusClass(estado: string): string {

    const map: any = {
      'Pedido aprobado': "ok",
      'Pago pendiente': 'pending',
      'Validando pago': 'validating',
      'En preparación': 'preparing',
      'En camino': 'shipping'
    };

    return map[estado] || 'default';
  }

  private calcularResumen(): void {

    const activas = this.requests;

    this.summary.activas = activas.length;

    this.summary.preparacion =
      activas.filter(r =>
        r.rawStatus === 'Validando pago' ||
        r.rawStatus === 'En preparación'
      ).length;

    this.summary.camino =
      activas.filter(r =>
        r.rawStatus === 'En camino'
      ).length;

    this.summary.entregadas = 0;
  }
}
