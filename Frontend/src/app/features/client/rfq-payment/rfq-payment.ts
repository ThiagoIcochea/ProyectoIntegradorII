import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import {
  APP_API_BASE_URL,
  APP_ROUTE_PATHS,
  APP_STORAGE_KEYS
} from '../../../core/constants/app.constants';

@Component({
  selector: 'app-rfq-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rfq-payment.html',
  styleUrl: './rfq-payment.scss'
})
export class RfqPaymentComponent implements OnInit {

  solicitudId!: number;

  provider: any = null;
  metodosPago: any[] = [];

  selectedMetodo: any = null;

  codigoOperacion = '';
  direccionEntrega = '';

  archivoCaptura: File | null = null;
  previewUrl: string | null = null;
  nombreArchivoCaptura = '';

  totalSolicitud = 0;

  procesandoPago = false;

  loadingMetodos = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    const id = localStorage.getItem(APP_STORAGE_KEYS.currentSolicitudId);

    if (!id) {
      this.router.navigate([APP_ROUTE_PATHS.clientRequests]);
      return;
    }

    this.solicitudId = Number(id);

    this.cargarSolicitud();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

  cargarSolicitud(): void {

    this.http.get<any>(
      `${APP_API_BASE_URL}/solicitudes/${this.solicitudId}/tracking`,
      { headers: this.headers() }
    ).subscribe({

      next: (res) => {

        this.provider = {
          nombreProveedor: res.proveedor,
          idProveedor: res.idProveedor
        };

        this.totalSolicitud = res.total;
        this.direccionEntrega = res.direccion;

        this.cargarMetodosPago(res.idProveedor);
      },

      error: () => {
        this.cargarMetodosPago(0);
      }
    });
  }

  cargarMetodosPago(id: number): void {

    this.loadingMetodos = true;

    this.http.get<any[]>(
      `${APP_API_BASE_URL}/solicitudes/proveedor/${id}/metodos-pago`,
      { headers: this.headers() }
    )
    .pipe(
      finalize(() => {
        this.loadingMetodos = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({

      next: (res) => {
        this.metodosPago = res || [];
        this.cdr.detectChanges();
      },

      error: () => {
        this.metodosPago = [];
      }
    });
  }

  onFileSelected(e: any): void {

    this.archivoCaptura = e.target.files[0];
    this.nombreArchivoCaptura = this.archivoCaptura?.name || '';

    if (!this.archivoCaptura) return;

    const reader = new FileReader();

    reader.onload = () => {
      this.previewUrl = reader.result as string;
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(this.archivoCaptura);
  }

  confirmarPago(): void {

    const formData = new FormData();

    formData.append('archivo', this.archivoCaptura!);
    formData.append('codigoOperacion', this.codigoOperacion);
    formData.append('entidad', this.selectedMetodo.entidad);
    formData.append('metodo', this.selectedMetodo.tipo);

    formData.append('monto', String(this.totalSolicitud));

    this.http.post(
      `${APP_API_BASE_URL}/solicitudes/${this.solicitudId}/pagar`,
      formData,
      { headers: this.headers() }
    ).subscribe(() => {
      this.router.navigate([APP_ROUTE_PATHS.clientRequests]);
    });
  }
}