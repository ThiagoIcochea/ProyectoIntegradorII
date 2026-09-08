import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  APP_API_BASE_URL,
  APP_STORAGE_KEYS
} from '../../../core/constants/app.constants';

export interface RegistrarEvaluacionRequest {

  idSolicitud: number;

  estrellasServicio: number;

  estrellasCalidad: number;

  estrellasTiempo: number;

  estrellasComunicacion: number;

  comentario: string;

}

export interface EvaluacionResponse {

  idEvaluacion: number;

  idSolicitud: number;

  estrellasServicio: number;

  estrellasCalidad: number;

  estrellasTiempo: number;

  estrellasComunicacion: number;

  comentario: string;

  fecha: string;

}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly apiUrl =
    `${APP_API_BASE_URL}/evaluaciones`;

  constructor(
    private http: HttpClient
  ) {}

  private headers(): HttpHeaders {

    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });

  }

  registrarEvaluacion(
    request: RegistrarEvaluacionRequest
  ): Observable<EvaluacionResponse> {

    return this.http.post<EvaluacionResponse>(
      this.apiUrl,
      request,
      {
        headers: this.headers()
      }
    );

  }

  sendDelayClaimEmail(body: any): Observable<any> {

    return this.http.post(
      `${APP_API_BASE_URL}/notificaciones/reclamo-demora`,
      body,
      {
        headers: this.headers()
      }
    );

  }

}