import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

interface ConfigItem {
  id: number;
  clave: string;
  valor: string;
  tipo: string;
  estado: string;
  testeable: boolean;
  originalValue?: string;
  saving?: boolean;
  testing?: boolean;
  message?: string;
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class AdminSettingsComponent implements OnInit {
  configs: ConfigItem[] = [];
  loading = true;
  errorMessage = '';
  readonly skeletonRows = Array.from({ length: 5 });

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token) || ''}`
    });
  }

  loadConfig(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<ConfigItem[]>(`${APP_API_BASE_URL}/config`, { headers: this.headers() })
      .subscribe({
        next: (configs) => {
          this.configs = (configs || []).map(config => ({
            ...config,
            valor: config.valor || '',
            originalValue: config.valor || '',
            message: ''
          }));
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.configs = [];
          this.errorMessage = 'No se pudo cargar la configuracion.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  save(item: ConfigItem): void {
    if (!item || item.saving || !this.hasChanges(item)) {
      return;
    }

    item.saving = true;
    item.message = '';

    this.http.put(
      `${APP_API_BASE_URL}/config/${item.id}`,
      { valor: item.valor },
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        item.originalValue = item.valor;
        item.saving = false;
        item.message = 'Guardado';
        this.cdr.detectChanges();
      },
      error: () => {
        item.saving = false;
        item.message = 'No se pudo guardar';
        this.cdr.detectChanges();
      }
    });
  }

  test(item: ConfigItem): void {
    if (!item?.testeable || item.testing) {
      return;
    }

    item.testing = true;
    item.message = '';

    this.http.post(
      `${APP_API_BASE_URL}/config/${item.id}/test`,
      {},
      {
        headers: this.headers(),
        responseType: 'text'
      }
    ).subscribe({
      next: (result) => {
        item.estado = result === 'OK' ? 'ACTIVO' : 'INACTIVO';
        item.testing = false;
        item.message = result === 'OK' ? 'Conexion correcta' : 'Conexion fallida';
        this.cdr.detectChanges();
      },
      error: () => {
        item.estado = 'INACTIVO';
        item.testing = false;
        item.message = 'Conexion fallida';
        this.cdr.detectChanges();
      }
    });
  }

  hasChanges(item: ConfigItem): boolean {
    return (item?.valor || '') !== (item?.originalValue || '');
  }
}
