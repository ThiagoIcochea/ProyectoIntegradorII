import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../constants/app.constants';

const swalBaseOptions = {
  iconColor: '#2563eb',
  buttonsStyling: false,
  customClass: {
    container: 'mfa-swal-container',
    popup: 'mfa-swal-popup',
    icon: 'mfa-swal-icon',
    title: 'mfa-swal-title',
    htmlContainer: 'mfa-swal-description',
    input: 'mfa-swal-input',
    actions: 'mfa-swal-actions',
    validationMessage: 'mfa-swal-validation',
    confirmButton: 'btn-primary',
    cancelButton: 'btn-secondary',
    denyButton: 'btn-secondary'
  }
};

export type MfaPurpose =
  'LOGIN' |
  'REGISTER_CLIENT' |
  'REGISTER_PROVIDER' |
  'PROFILE_UPDATE' |
  'PROVIDER_API_UPDATE' |
  'ADMIN_ACTION';

type MfaMethod = 'email' | 'sms' | 'whatsapp' | 'call';

@Injectable({ providedIn: 'root' })
export class MfaService {

  constructor(private http: HttpClient) {}

  startChallenge(email: string, purpose: MfaPurpose, method = 'email'): Promise<any> {
    return firstValueFrom(this.http.post(`${APP_API_BASE_URL}/auth/mfa/challenge`, {
      email,
      purpose,
      method
    }));
  }

  verifyChallenge(email: string, tempToken: string, code: string, purpose: MfaPurpose, method = 'email'): Promise<any> {
    return firstValueFrom(this.http.post(`${APP_API_BASE_URL}/auth/mfa/verify`, {
      email,
      tempToken,
      code,
      method,
      purpose
    }));
  }

  async requestActionToken(email: string, purpose: MfaPurpose, method?: MfaMethod | string): Promise<string> {
    let selectedMethod = await this.resolveMethod(method);
    let start: any;

    try {
      start = await this.startChallenge(email, purpose, selectedMethod);
    } catch (error) {
      if (selectedMethod === 'email') {
        throw error;
      }

      selectedMethod = 'email';
      start = await this.startChallenge(email, purpose, selectedMethod);
    }

    const channel = this.methodLabel(selectedMethod);
    const code = await this.promptForCode(channel, async () => {
      const refreshed = await this.startChallenge(email, purpose, selectedMethod);
      start = refreshed;
      return refreshed;
    });

    if (!code) {
      throw new Error('Verificacion multifactor cancelada.');
    }

    const verified: any = await this.verifyChallenge(email, start.tempToken, code, purpose, selectedMethod);

    if (!verified?.mfaActionToken) {
      throw new Error('No se pudo obtener la autorizacion multifactor.');
    }

    return verified.mfaActionToken;
  }

  private async resolveMethod(method?: MfaMethod | string): Promise<MfaMethod> {
    const normalized = String(method || '').trim().toLowerCase();

    if (this.isMethod(normalized)) {
      return normalized;
    }

    const selected = await this.promptForMethodSelection();

    if (!selected) {
      throw new Error('Verificacion multifactor cancelada.');
    }

    return this.normalizeMethod(selected);
  }

  private async promptForMethodSelection(): Promise<string | null> {
    const { isConfirmed, value } = await Swal.fire({
      icon: 'info',
      title: 'Verificación multifactor',
      text: 'Elige el canal MFA para confirmar esta acción.',
      input: 'select',
      inputOptions: {
        email: 'Correo',
        sms: 'SMS',
        whatsapp: 'WhatsApp',
        call: 'Llamada'
      },
      inputValue: 'whatsapp',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      ...swalBaseOptions
    });

    if (!isConfirmed) {
      return null;
    }

    return String(value || 'email');
  }

  private async promptForCode(channel: string, resendChallenge?: () => Promise<any>): Promise<string> {
    const prompt = async (resending = false): Promise<string> => {
      const { isConfirmed, isDenied, value } = await Swal.fire({
        icon: 'info',
        title: resending ? 'Reenviar código MFA' : 'Código MFA',
        text: resending
          ? `Se reenvió el código por ${channel}. Ingresa el nuevo código.`
          : `Ingresa el código multifactor enviado por ${channel}.`,
        input: 'text',
        inputAttributes: {
          autocomplete: 'one-time-code',
          inputmode: 'numeric',
          maxlength: '6',
          pattern: '[0-9]*',
          'aria-label': 'Codigo MFA de 6 digitos'
        },
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        denyButtonText: 'Reenviar',
        cancelButtonText: 'Cancelar',
        allowOutsideClick: false,
        ...swalBaseOptions,
        inputValidator: (candidate) => {
          const normalized = String(candidate || '').replace(/\D/g, '');
          if (normalized.length !== 6) {
            return 'Ingresa el código completo.';
          }

          return null;
        }
      });

      if (isDenied) {
        if (resendChallenge) {
          try {
            await resendChallenge();
            return prompt(true);
          } catch (error: any) {
            await Swal.fire({
              icon: 'warning',
              title: 'No se pudo reenviar',
              text: error?.message || 'No se pudo reintentar el envío del código.',
              ...swalBaseOptions
            });
          }
        }

        return '';
      }

      if (!isConfirmed) {
        return '';
      }

      return String(value || '').replace(/\D/g, '').slice(0, 6);
    };

    return prompt(false);
  }

  private normalizeMethod(value: string | null | undefined): MfaMethod {
    const normalized = String(value || '').trim().toLowerCase();

    if (normalized === 'correo' || normalized === 'email') {
      return 'email';
    }

    if (normalized === 'llamada' || normalized === 'call') {
      return 'call';
    }

    if (this.isMethod(normalized)) {
      return normalized;
    }

    return 'email';
  }

  private isMethod(value: string): value is MfaMethod {
    return ['email', 'sms', 'whatsapp', 'call'].includes(value);
  }

  private methodLabel(method: MfaMethod): string {
    const labels: Record<MfaMethod, string> = {
      email: 'correo',
      sms: 'SMS',
      whatsapp: 'WhatsApp',
      call: 'llamada'
    };

    return labels[method];
  }

  authHeaders(extra?: Record<string, string>): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`,
      ...(extra || {})
    });
  }
}
