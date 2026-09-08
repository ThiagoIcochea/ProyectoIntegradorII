import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../constants/app.constants';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly API = APP_API_BASE_URL;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`,
      'Content-Type': 'application/json'
    });
  }

  // Ask backend to send evaluation email to client (or provider -> client flow)
  notifyEvaluation(solicitudId: number): Observable<any> {
    const url = `${this.API}/solicitudes/${solicitudId}/notify-evaluation`;
    return this.http.post(url, {}, { headers: this.headers() }).pipe(
      catchError(err => {
        console.warn('[NotificationService] notifyEvaluation failed', err);
        return of(null);
      })
    );
  }

  // Called after timeout to force-complete if evaluation not resolved yet
  autoCompleteIfUnresolved(solicitudId: number): Observable<any> {
    const url = `${this.API}/solicitudes/${solicitudId}/auto-complete`;
    return this.http.post(url, {}, { headers: this.headers() }).pipe(
      catchError(err => {
        console.warn('[NotificationService] autoCompleteIfUnresolved failed', err);
        return of(null);
      })
    );
  }

  // Resolve evaluation (called when user submits rating)
  resolveEvaluation(solicitudId: number): Observable<any> {
    const url = `${this.API}/solicitudes/${solicitudId}/evaluation`;
    return this.http.post(url, {}, { headers: this.headers() }).pipe(
      catchError(err => {
        console.warn('[NotificationService] resolveEvaluation failed', err);
        return of(null);
      })
    );
  }

  // Send a claim email with evidence (used by tracking page)
  sendDelayClaimEmail(payload: any): Observable<any> {
    const url = `${this.API}/reclamos/demora`;
    return this.http.post(url, payload, { headers: this.headers() }).pipe(
      catchError(err => {
        console.warn('[NotificationService] sendDelayClaimEmail failed', err);
        return of(null);
      })
    );
  }
}
