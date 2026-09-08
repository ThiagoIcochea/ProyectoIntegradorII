import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';
import { extractValidationMessage } from '../../../core/utils/form-validation';
import { MfaService } from '../../../core/services/mfa.service';

@Component({
  selector: 'app-admin-integrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './integrations.html',
  styleUrl: './integrations.scss'
})
export class AdminIntegrationsComponent
implements OnInit {

  private API_URL =
    `${APP_API_BASE_URL}/config`;

  integrations: any[] = [];
  loading = true;
  readonly skeletonCards = Array.from({ length: 6 });
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private mfaService: MfaService
  ) {}

  ngOnInit(): void {

    setTimeout(() => {

      this.listar();

      this.cdr.detectChanges();

    }, 0);
  }

  private headers(): HttpHeaders {

    return new HttpHeaders({
      Authorization:
        `Bearer ${localStorage.getItem('token')}`
    });
  }

  listar(): void {
    this.loading = true;

    this.http.get<any[]>(
      this.API_URL,
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {

        this.integrations = res;
        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(err);
        this.integrations = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  probarConexion(item: any): void {

    if (!item.testeable) {
      return;
    }

    this.http.post(
      `${this.API_URL}/${item.id}/test`,
      {},
      {
        headers: this.headers(),
        responseType: 'text'
      }
    )
    .subscribe({

      next: (res) => {

        item.estado =
          res === 'OK'
          ? 'ACTIVO'
          : 'INACTIVO';

        this.cdr.detectChanges();
      },

      error: () => {

        item.estado = 'INACTIVO';

        this.cdr.detectChanges();
      }
    });
  }

  async crearConfiguracion(): Promise<void> {
    const { isConfirmed, value } = await Swal.fire({
      title: 'Nueva variable de integración',
      html: this.buildConfigModalHtml('', 'KEY', 'ACTIVO', ''),
      customClass: {
        container: 'integrations-swal-container',
        popup: 'integrations-swal-popup',
        title: 'integrations-swal-title',
        htmlContainer: 'integrations-swal-description',
        actions: 'integrations-swal-actions',
        confirmButton: 'integrations-swal-confirm',
        cancelButton: 'integrations-swal-cancel'
      },
      buttonsStyling: false,
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      preConfirm: () => ({
        clave: (document.getElementById('config-clave') as HTMLInputElement | null)?.value?.trim() || '',
        valor: (document.getElementById('config-valor') as HTMLInputElement | null)?.value?.trim() || '',
        tipo: (document.getElementById('config-tipo') as HTMLInputElement | null)?.value?.trim() || 'KEY',
        estado: (document.getElementById('config-estado') as HTMLSelectElement | null)?.value?.trim() || 'ACTIVO'
      })
    });

    if (!isConfirmed || !value?.clave) {
      return;
    }

    const token = await this.requestAdminMfa();
    if (!token) {
      return;
    }

    this.http.post(
      this.API_URL,
      value,
      {
        headers: this.headers().set('X-MFA-Authorization', token)
      }
    ).subscribe({
      next: async () => {
        await Swal.fire({ icon: 'success', title: 'Variable creada', text: 'La configuración se agregó correctamente.' });
        this.listar();
      },
      error: async (err) => {
        await Swal.fire({ icon: 'error', title: 'No se pudo crear', text: extractValidationMessage(err, 'No se pudo crear la configuración.') });
      }
    });
  }

  async configurar(item: any): Promise<void> {
    const selectedKey = item.clave || 'CONFIG';
    const selectedType = item.tipo || 'CONFIG';
    const selectedState = item.estado || 'ACTIVO';
    const { isConfirmed, value } = await Swal.fire({
      title: `Editar ${item.clave}`,
      html: this.buildConfigModalHtml(selectedKey, selectedType, selectedState, item.valor || ''),
      customClass: {
        container: 'integrations-swal-container',
        popup: 'integrations-swal-popup',
        title: 'integrations-swal-title',
        htmlContainer: 'integrations-swal-description',
        actions: 'integrations-swal-actions',
        confirmButton: 'integrations-swal-confirm',
        cancelButton: 'integrations-swal-cancel'
      },
      buttonsStyling: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      preConfirm: () => ({
        clave: (document.getElementById('config-clave') as HTMLInputElement | null)?.value?.trim() || '',
        valor: (document.getElementById('config-valor') as HTMLInputElement | null)?.value?.trim() || '',
        tipo: (document.getElementById('config-tipo') as HTMLInputElement | null)?.value?.trim() || 'KEY',
        estado: (document.getElementById('config-estado') as HTMLSelectElement | null)?.value?.trim() || 'ACTIVO'
      })
    });

    if (!isConfirmed || !value?.clave) {
      return;
    }

    const token = await this.requestAdminMfa();
    if (!token) {
      return;
    }

    this.http.put(
      `${this.API_URL}/${item.id}`,
      {
        valor: value.valor,
        clave: value.clave,
        tipo: value.tipo,
        estado: value.estado
      },
      {
        headers: this.headers().set('X-MFA-Authorization', token)
      }
    )
    .subscribe({
      next: async () => {
        item.clave = value.clave;
        item.valor = value.valor;
        item.tipo = value.tipo;
        item.estado = value.estado;

        this.integrations = this.integrations.map(config => config.id === item.id ? { ...config, ...item } : config);
        this.cdr.detectChanges();

        await Swal.fire({
          icon: 'success',
          title: 'Configuración actualizada',
          text: 'El valor quedó guardado correctamente.'
        });
      },
      error: async (err) => {
        await Swal.fire({
          icon: 'error',
          title: 'No se pudo actualizar',
          text: extractValidationMessage(err, 'No se pudo guardar la configuración.')
        });
      }
    });
  }

  async eliminarConfiguracion(item: any): Promise<void> {
    const { isConfirmed } = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar variable',
      text: `¿Deseas eliminar ${item.clave}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed) {
      return;
    }

    const token = await this.requestAdminMfa();
    if (!token) {
      return;
    }

    this.http.delete(
      `${this.API_URL}/${item.id}`,
      {
        headers: this.headers().set('X-MFA-Authorization', token)
      }
    ).subscribe({
      next: async () => {
        await Swal.fire({ icon: 'success', title: 'Variable eliminada', text: 'La configuración se quitó correctamente.' });
        this.listar();
      },
      error: async (err) => {
        await Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: extractValidationMessage(err, 'No se pudo eliminar la configuración.') });
      }
    });
  }

  private buildConfigModalHtml(selectedKey: string, selectedType: string, selectedState: string, currentValue: string): string {
    const escapedValue = this.escapeHtml(currentValue || '');
    const stateOptions = this.buildOptionsHtml(['ACTIVO', 'INACTIVO'], selectedState);

    return `
      <div class="config-modal-shell">
        <div class="config-modal-field">
          <label class="config-modal-label" for="config-clave">Clave</label>
          <input id="config-clave" class="config-modal-input" value="${this.escapeHtml(selectedKey || '')}" placeholder="Ej. AI_COMMENTS" autocomplete="off" />
        </div>

        <div class="config-modal-field">
          <label class="config-modal-label" for="config-valor">Valor</label>
          <input id="config-valor" class="config-modal-input" value="${escapedValue}" placeholder="Ej. tu-token, dominio, URL o valor de integración" />
        </div>

        <div class="config-modal-field">
          <label class="config-modal-label" for="config-tipo">Tipo</label>
          <input id="config-tipo" class="config-modal-input" value="${this.escapeHtml(selectedType || 'KEY')}" placeholder="Ej. KEY, URL o CONFIG" autocomplete="off" />
        </div>

        <div class="config-modal-field">
          <label class="config-modal-label" for="config-estado">Estado</label>
          <select id="config-estado" class="config-modal-input">
            ${stateOptions}
          </select>
        </div>
      </div>
    `;
  }

  private buildOptionsHtml(options: string[], selectedValue: string): string {
    const normalizedSelected = (selectedValue || '').trim().toUpperCase();
    const values = options.map(option => {
      const isSelected = normalizedSelected === option.toUpperCase();
      return `<option value="${this.escapeHtml(option)}" ${isSelected ? 'selected' : ''}>${this.escapeHtml(option)}</option>`;
    });

    if (!options.some(option => option.toUpperCase() === normalizedSelected)) {
      values.unshift(`<option value="${this.escapeHtml(normalizedSelected)}" selected>${this.escapeHtml(normalizedSelected)}</option>`);
    }

    return values.join('');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private async requestAdminMfa(): Promise<string | null> {
    try {
      const email = localStorage.getItem('auth_user_email') || '';
      if (!email) {
        throw new Error('No se encontrÃ³ el correo del administrador activo.');
      }

      return await this.mfaService.requestActionToken(email, 'ADMIN_ACTION');
    } catch (error: any) {
      if (error?.message && !error.message.includes('cancelada')) {
        await Swal.fire({
          icon: 'error',
          title: 'No se pudo validar el MFA',
          text: error.message
        });
      }
      return null;
    }
  }
}
