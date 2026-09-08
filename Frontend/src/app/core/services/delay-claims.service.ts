import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  APP_API_BASE_URL,
  APP_STORAGE_KEYS
} from '../constants/app.constants';
import { Observable } from 'rxjs';

export interface DelayClaim {
  id?: string;
  idSolicitud: number;
  idProveedor?: number | null;
  proveedor: string;
  empresaCliente: string;
  orderCode: string;
  motivo: 'DEMORA' | 'CANCELACION' | 'ENTREGA_INCOMPLETA';
  descripcion: string;
  fechaPrometida?: string;
  diasDemora?: number;
  accion?: string;
  nuevoEstado?: string;
  motivoCancelacion?: string;
  estado?: 'PENDIENTE_PROVEEDOR' | 'RESPONDIDO' | 'CERRADO';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DelayClaimsService {

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

save(
    claim: Omit<DelayClaim,'id'|'createdAt'|'updatedAt'|'estado'>,
    evidencia?: File
): Observable<any> {

    const formData = new FormData();

    formData.append(
      'idSolicitud',
      String(claim.idSolicitud)
    );

    formData.append(
      'descripcion',
      claim.descripcion
    );

    formData.append(
      'tipo',
      claim.motivo
    );

    formData.append(
      'accion',
      claim.accion || 'MANTENER'
    );

    if (claim.nuevoEstado) {
      formData.append('nuevoEstado', claim.nuevoEstado);
    }

    if (claim.motivoCancelacion) {
      formData.append('motivoCancelacion', claim.motivoCancelacion);
    }

    if (evidencia) {
      formData.append(
        'evidencia',
        evidencia
      );
    }

    return this.http.post(
      `${APP_API_BASE_URL}/reclamos/demora`,
      formData,
      {
        headers: this.headers()
      }
    );
}

}