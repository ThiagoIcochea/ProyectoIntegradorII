import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, shareReplay } from 'rxjs';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../constants/app.constants';

export interface ProviderApiConfig {
  estado?: string | null;
  estadoConexion?: string | null;
}

export interface ProviderRequestSummary {
  idSolicitud?: number | string;
  estado?: string;
  total?: number | string;
  nombreProveedor?: string;
  nombreEmpresa?: string;
  nombreCliente?: string;
  direccionEnvio?: string;
  rucEmpresa?: string;
  detalles?: unknown[];
  fechaCreacion?: string;
}

export interface ProviderClaimSummary {
  estado?: string;
}

export type ProviderPaymentSummary = Record<string, unknown>;
export type ProviderDeliverySummary = Record<string, unknown>;

@Injectable({
  providedIn: 'root'
})
export class ProviderShellDataService {
  private providerApi$?: Observable<ProviderApiConfig>;
  private providerRequests$?: Observable<ProviderRequestSummary[]>;
  private providerPayments$?: Observable<ProviderPaymentSummary[]>;
  private providerDeliveries$?: Observable<ProviderDeliverySummary[]>;
  private providerClaims$?: Observable<ProviderClaimSummary[]>;

  constructor(private http: HttpClient) {}

  getProviderApi(refresh = false): Observable<ProviderApiConfig> {
    if (refresh || !this.providerApi$) {
      this.providerApi$ = this.http.get<ProviderApiConfig>(
        `${APP_API_BASE_URL}/proveedor-api`,
        { headers: this.headers() }
      ).pipe(
        catchError(() => of({ estadoConexion: 'Desconectada' })),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.providerApi$;
  }

  getProviderRequests(refresh = false): Observable<ProviderRequestSummary[]> {
    if (refresh || !this.providerRequests$) {
      this.providerRequests$ = this.http.get<ProviderRequestSummary[]>(
        `${APP_API_BASE_URL}/solicitudes/proveedor/mis-solicitudes`,
        { headers: this.headers() }
      ).pipe(
        catchError(() => of([])),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.providerRequests$;
  }

  getProviderPayments(refresh = false): Observable<ProviderPaymentSummary[]> {
    if (refresh || !this.providerPayments$) {
      this.providerPayments$ = this.http.get<ProviderPaymentSummary[]>(
        `${APP_API_BASE_URL}/pagos/proveedor/mis-pagos`,
        { headers: this.headers() }
      ).pipe(
        catchError(() => of([])),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.providerPayments$;
  }

  getProviderDeliveries(refresh = false): Observable<ProviderDeliverySummary[]> {
    if (refresh || !this.providerDeliveries$) {
      this.providerDeliveries$ = this.http.get<ProviderDeliverySummary[]>(
        `${APP_API_BASE_URL}/solicitudes/proveedor/entregas`,
        { headers: this.headers() }
      ).pipe(
        catchError(() => of([])),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.providerDeliveries$;
  }

  getProviderClaims(refresh = false): Observable<ProviderClaimSummary[]> {
    if (refresh || !this.providerClaims$) {
      this.providerClaims$ = this.http.get<ProviderClaimSummary[]>(
        `${APP_API_BASE_URL}/reclamos/proveedor/mis-reclamos`,
        { headers: this.headers() }
      ).pipe(
        catchError(() => of([])),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.providerClaims$;
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }
}
