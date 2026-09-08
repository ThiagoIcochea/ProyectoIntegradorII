import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';
import { ProviderClaim, UpdateClaimStatusRequest } from './claim.model';

@Injectable({
  providedIn: 'root'
})
export class ProviderClaimsService {
  constructor(private http: HttpClient) {}

  listarReclamos(): Observable<ProviderClaim[]> {
    return this.http.get<ProviderClaim[]>(
      `${APP_API_BASE_URL}/reclamos/proveedor/mis-reclamos`
    );
  }

  actualizarEstado(idReclamo: number, request: UpdateClaimStatusRequest): Observable<ProviderClaim> {
    return this.http.put<ProviderClaim>(
      `${APP_API_BASE_URL}/reclamos/proveedor/${idReclamo}/estado`,
      request
    );
  }
}
