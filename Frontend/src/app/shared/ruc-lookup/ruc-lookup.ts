import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, switchMap, timer } from 'rxjs';
import { APP_API_BASE_URL } from '../../core/constants/app.constants';

export interface EmpresaRuc { ruc: string; razonSocial: string; descripcion: string; actividadEconomica?: string; }

@Component({
  selector: 'app-ruc-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <label for="empresa-ruc">RUC</label>
    <input id="empresa-ruc" type="text" inputmode="numeric" maxlength="11"
      [ngModel]="ruc" (ngModelChange)="cambiarRuc($event)" [ngModelOptions]="{standalone: true}"
      placeholder="Ingresa los 11 digitos" aria-describedby="ruc-status" />
    <div id="ruc-status" aria-live="polite">
      <p *ngIf="loading()">Consultando datos de la empresa...</p>
      <div *ngIf="error()" class="ruc-error" role="alert">
        <p>{{ error() }}</p>
        <button type="button" class="btn-outline" [disabled]="loading()" (click)="consultar()">Reintentar</button>
      </div>
    </div>
    <div *ngIf="empresa() as datos">
      <label>Razon social</label><p>{{ datos.razonSocial }}</p>
      <label>Actividad economica (SUNAT)</label>
      <p>{{ datos.actividadEconomica || datos.descripcion || 'Actividad economica no disponible en la consulta.' }}</p>
    </div>
    <small>La razon social y la actividad economica se consultan automaticamente con el RUC.</small>
  `,
  styleUrl: './ruc-lookup.scss'
})
export class RucLookupComponent implements OnChanges, OnDestroy {
  @Input() ruc = '';
  @Output() rucChange = new EventEmitter<string>();
  @Output() empresaChange = new EventEmitter<EmpresaRuc | null>();
  readonly loading = signal(false);
  readonly error = signal('');
  readonly empresa = signal<EmpresaRuc | null>(null);
  private request?: Subscription;
  constructor(private http: HttpClient) {}
  ngOnChanges(): void { this.consultar(); }
  ngOnDestroy(): void { this.request?.unsubscribe(); }
  cambiarRuc(value: string): void {
    this.ruc = value.replace(/\D/g, '').slice(0, 11);
    this.rucChange.emit(this.ruc);
    this.empresaChange.emit(null);
    this.consultar();
  }
  consultar(): void {
    this.request?.unsubscribe();
    this.empresa.set(null);
    this.loading.set(false);
    this.error.set('');
    const ruc = this.ruc;
    if (!/^(10|20)\d{9}$/.test(ruc)) {
      if (ruc) this.error.set('El RUC debe tener 11 digitos y empezar con 10 o 20.');
      return;
    }
    this.loading.set(true);
    this.request = timer(350).pipe(switchMap(() =>
      this.http.get<EmpresaRuc>(`${APP_API_BASE_URL}/auth/proveedor/ruc/${ruc}`)
    )).subscribe({
      next: datos => {
        this.loading.set(false);
        if (datos.ruc !== this.ruc || !datos.razonSocial) {
          this.error.set('La consulta no devolvio datos validos para este RUC.');
          this.empresaChange.emit(null);
          return;
        }
        this.empresa.set(datos);
        this.empresaChange.emit(datos);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.status === 403
          ? 'El servidor denego el acceso a la consulta de RUC. Reintenta en unos momentos.'
          : err.status === 0
            ? 'No se pudo conectar con el servicio de consulta. Revisa tu conexion y reintenta.'
            : 'No se pudo consultar el RUC. Verifica el numero y reintenta.');
        this.empresaChange.emit(null);
      }
    });
  }
}
