import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { APP_API_BASE_URL, APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

type MfaMethod = 'email' | 'whatsapp' | 'sms' | 'call';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: '../mfa/mfa.scss'
})
export class ForgotPasswordComponent {
  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  private readonly passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;

  email = '';
  method: MfaMethod = 'email';
  digits = ['', '', '', '', '', ''];
  newPassword = '';
  confirmPassword = '';
  step: 'email' | 'code' | 'password' = 'email';
  loading = false;
  errorMessage = '';
  successMessage = '';
  tempToken = '';
  actionToken = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  handleDigitKeydown(event: KeyboardEvent, index: number): void {
    const target = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      event.preventDefault();
      if (this.digits[index]) {
        this.digits[index] = '';
        this.cdr.detectChanges();
        return;
      }
      if (index > 0) {
        this.digits[index - 1] = '';
        this.cdr.detectChanges();
        setTimeout(() => document.querySelector<HTMLInputElement>(`#reset-digit-${index - 1}`)?.focus());
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      setTimeout(() => document.querySelector<HTMLInputElement>(`#reset-digit-${index - 1}`)?.focus());
      return;
    }

    if (event.key === 'ArrowRight' && index < this.digits.length - 1) {
      event.preventDefault();
      setTimeout(() => document.querySelector<HTMLInputElement>(`#reset-digit-${index + 1}`)?.focus());
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  start(): void {
    const cleanEmail = this.email.trim().toLowerCase();

    if (!this.emailRegex.test(cleanEmail)) {
      this.errorMessage = 'Correo invalido. Usa un formato como usuario@empresa.com.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<any>(`${APP_API_BASE_URL}/auth/forgot-password/start`, {
      email: cleanEmail,
      method: this.method
    }).subscribe({
      next: res => {
        this.tempToken = res?.tempToken || '';
        if (!this.tempToken) {
          this.loading = false;
          this.errorMessage = 'No se recibio el flujo MFA. Intenta nuevamente.';
          this.cdr.detectChanges();
          return;
        }
        this.email = cleanEmail;
        this.step = 'code';
        this.loading = false;
        this.successMessage = `Codigo enviado por ${this.methodLabel(this.method)}. Ingresa los 6 digitos.`;
        this.cdr.detectChanges();
        this.focusCodeInput();
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'No se pudo enviar el codigo.';
        this.cdr.detectChanges();
      }
    });
  }

  handleDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const raw = (input.value || '').replace(/\D/g, '');

    if (!raw) {
      this.digits[index] = '';
      return;
    }

    let cursor = index;
    for (const char of raw.split('')) {
      if (cursor >= this.digits.length) {
        break;
      }
      this.digits[cursor] = char;
      cursor++;
    }

    input.value = '';

    const nextIndex = Math.min(cursor, this.digits.length - 1);
    setTimeout(() => document.querySelector<HTMLInputElement>(`#reset-digit-${nextIndex}`)?.focus());

    if (this.digits.every(Boolean)) {
      this.verifyCode();
    }
  }

  changeMethod(method: MfaMethod): void {
    if (this.loading || this.method === method) {
      return;
    }

    this.method = method;
    this.resendCode();
  }

  resendCode(): void {
    if (this.loading || !this.tempToken) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<any>(`${APP_API_BASE_URL}/auth/mfa/resend`, {
      email: this.email.trim(),
      tempToken: this.tempToken,
      method: this.method
    }).subscribe({
      next: res => {
        this.tempToken = res?.tempToken || this.tempToken;
        this.digits = ['', '', '', '', '', ''];
        this.loading = false;
        this.successMessage = `Codigo reenviado por ${this.methodLabel(this.method)}.`;
        this.cdr.detectChanges();
        this.focusCodeInput();
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || `No se pudo reenviar por ${this.methodLabel(this.method)}.`;
        this.cdr.detectChanges();
      }
    });
  }

  pasteCode(event: ClipboardEvent): void {
    const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!pasted) {
      return;
    }

    event.preventDefault();

    for (let i = 0; i < pasted.length && i < this.digits.length; i++) {
      this.digits[i] = pasted[i];
    }

    setTimeout(() => {
      const nextIndex = Math.min(pasted.length, this.digits.length - 1);
      document.querySelector<HTMLInputElement>(`#reset-digit-${nextIndex}`)?.focus();
    });

    if (this.digits.every(Boolean)) {
      this.verifyCode();
    }
  }

  verifyCode(): void {
    if (this.loading) {
      return;
    }

    const code = this.digits.join('');
    if (code.length !== 6) {
      this.errorMessage = 'Ingresa los 6 digitos.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<any>(`${APP_API_BASE_URL}/auth/mfa/verify`, {
      email: this.email.trim(),
      tempToken: this.tempToken,
      code,
      method: this.method,
      purpose: 'PASSWORD_RESET'
    }).subscribe({
      next: res => {
        this.actionToken = res?.mfaActionToken || '';
        if (!this.actionToken) {
          this.loading = false;
          this.errorMessage = 'No se recibio la autorizacion MFA. Solicita un nuevo codigo.';
          this.cdr.detectChanges();
          return;
        }
        this.step = 'password';
        this.loading = false;
        this.successMessage = 'Codigo verificado. Ahora crea tu nueva contrasena.';
        this.cdr.detectChanges();
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Codigo incorrecto o expirado.';
        this.digits = ['', '', '', '', '', ''];
        this.cdr.detectChanges();
        this.focusCodeInput();
      }
    });
  }

  complete(): void {
    if (!this.passwordRegex.test(this.newPassword)) {
      this.errorMessage = 'Contrasena invalida: minimo 8 caracteres, una mayuscula, una minuscula y un numero.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Las contrasenas no coinciden.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<any>(`${APP_API_BASE_URL}/auth/forgot-password/complete`, {
      email: this.email.trim(),
      mfaActionToken: this.actionToken,
      newPassword: this.newPassword
    }).subscribe({
      next: res => {
        this.loading = false;
        const login = res?.login;
        if (login?.token) {
          const role = this.normalizeRole(login.rol);
          localStorage.setItem(APP_STORAGE_KEYS.token, login.token);
          localStorage.setItem(APP_STORAGE_KEYS.role, role);
          localStorage.setItem('auth_user_email', login.correo || this.email.trim());
          localStorage.setItem('auth_user_id', String(login.idUsuario ?? ''));
          this.router.navigate([this.redirectByRole(role)], { replaceUrl: true });
          return;
        }
        this.router.navigate([APP_ROUTE_PATHS.login], { replaceUrl: true });
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'No se pudo actualizar la contrasena.';
        this.cdr.detectChanges();
      }
    });
  }

  private normalizeRole(rol: string | null | undefined): string {
    return (rol || '').toUpperCase().replace(/^ROLE_/, '').trim();
  }

  private redirectByRole(role: string): string {
    if (role === 'ADMIN') return APP_ROUTE_PATHS.adminDashboard;
    if (role === 'PROVEEDOR') return APP_ROUTE_PATHS.providerDashboard;
    return APP_ROUTE_PATHS.clientDashboard;
  }

  methodLabel(method: string): string {
    const labels: Record<string, string> = {
      email: 'correo',
      whatsapp: 'WhatsApp',
      sms: 'SMS',
      call: 'llamada'
    };

    return labels[method] || method;
  }

  private focusCodeInput(): void {
    setTimeout(() => document.querySelector<HTMLInputElement>('#reset-digit-0')?.focus());
  }
}
