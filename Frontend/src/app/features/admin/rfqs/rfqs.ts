import { CommonModule } from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  HttpClient,
  HttpClientModule,
  HttpHeaders
} from '@angular/common/http';

import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-admin-rfqs',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule
  ],
  templateUrl: './rfqs.html',
  styleUrl: './rfqs.scss'
})
export class AdminRfqsComponent
implements OnInit {

  private API_URL =
    `${APP_API_BASE_URL}/solicitudes/admin/listar`;

  rfqs: any[] = [];

  filteredRfqs: any[] = [];

  search: string = '';

  loading = true;

  readonly skeletonRows =
    Array.from({ length: 5 });

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.listarRfqs();
  }

  private headers(): HttpHeaders {

    return new HttpHeaders({

      Authorization:
        `Bearer ${localStorage.getItem('token')}`

    });
  }

  listarRfqs(): void {

    this.loading = true;

    this.http.get<any[]>(
      this.API_URL,
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (data) => {

        this.rfqs = data;

        this.filteredRfqs = [...data];

        this.filtrarRfqs();

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(err);

        this.rfqs = [];

        this.filteredRfqs = [];

        this.loading = false;

        this.cdr.detectChanges();
      }

    });
  }

  filtrarRfqs(): void {

    const s =
      this.search.toLowerCase();

    this.filteredRfqs =
      this.rfqs.filter(rfq =>

        rfq?.idSolicitud
          ?.toString()
          .includes(s)

        ||

        rfq?.nombreCliente
          ?.toLowerCase()
          .includes(s)

        ||

        rfq?.nombreProveedor
          ?.toLowerCase()
          .includes(s)

        ||

        rfq?.nombreEmpresa
          ?.toLowerCase()
          .includes(s)

        ||

        rfq?.estado
          ?.toLowerCase()
          .includes(s)
      );

    this.cdr.detectChanges();
  }

  getTotalRfqs(): number {

    return this.filteredRfqs.length;
  }

  getPagadas(): number {

    return this.filteredRfqs.filter(
      r =>

        r.estado?.toUpperCase() === 'PAGADA'
        ||

        r.estado?.toUpperCase() === 'COMPLETADA'
    ).length;
  }

  getPendientes(): number {

    return this.filteredRfqs.filter(
      r =>

        r.estado?.toUpperCase() === 'PAGO_PENDIENTE'
        ||

        r.estado?.toUpperCase() === 'PAGO_VALIDANDO'
    ).length;
  }

  getCanceladas(): number {

    return this.filteredRfqs.filter(
      r =>
        r.estado?.toUpperCase() === 'CANCELADA'
    ).length;
  }

  formatearEstado(
    estado: string
  ): string {

    switch (estado) {

      case 'PAGO_PENDIENTE':
        return 'Pago pendiente';

      case 'PAGO_VALIDANDO':
        return 'Validando pago';

      case 'PAGADA':
        return 'Pagada';

      case 'EN_CAMINO':
        return 'En camino';

      case 'ENTREGADA':
        return 'Entregada';

      case 'CANCELADA':
        return 'Cancelada';

      case 'COMPLETADA':
        return 'Completada';

      default:
        return estado;
    }
  }

  formatearFecha(
    fecha: string
  ): string {

    return new Date(fecha)
      .toLocaleDateString('es-PE');
  }
}
