import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { APP_API_ORIGIN } from '../constants/app.constants';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private ws: WebSocket | null = null;
  private messages = new Subject<any>();

  connect(): void {
    if (this.ws) return;

    try {
      const origin = APP_API_ORIGIN.replace(/^http/, 'ws');
      const url = `${origin}/ws`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => console.log('[WS] connected', url);
      this.ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          this.messages.next(payload);
        } catch (e) {
          this.messages.next(ev.data);
        }
      };
      this.ws.onclose = () => {
        console.log('[WS] disconnected');
        this.ws = null;
      };
      this.ws.onerror = (err) => console.warn('[WS] error', err);
    } catch (err) {
      console.warn('[WS] connect failed', err);
      this.ws = null;
    }
  }

  disconnect(): void {
    if (!this.ws) return;
    this.ws.close();
    this.ws = null;
  }

  send(obj: any): void {
    if (!this.ws) return;
    try { this.ws.send(JSON.stringify(obj)); } catch {}
  }

  onMessage(): Observable<any> {
    return this.messages.asObservable();
  }
}
