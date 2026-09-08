import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { APP_API_BASE_URL, APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

type MfaMethod = 'email' | 'sms' | 'whatsapp' | 'call';

@Component({
  selector: 'app-mfa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mfa.html',
  styleUrl: './mfa.scss'
})
export class MfaComponent implements OnInit, OnDestroy {

  code = '';
  readonly digitSlots = Array.from({ length: 6 });
  method: MfaMethod = 'email';
  loading = false;
  errorMessage = '';
  resendSeconds = 30;
  expiresSeconds = 300;
  private timer: ReturnType<typeof setInterval> | null = null;
  flow: any = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const raw = sessionStorage.getItem('pending_mfa_flow');
    this.flow = raw ? JSON.parse(raw) : null;

    if (!this.flow?.email || !this.flow?.tempToken) {
      this.router.navigate([APP_ROUTE_PATHS.login], { replaceUrl: true });
      return;
    }

    if (this.flow.emailOnly) {
      this.method = 'email';
    }

    this.hydrateTimers();
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  updateCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/\D/g, '').slice(0, 6);
    this.code = sanitized;
    if (input.value !== sanitized) {
      input.value = sanitized;
    }
    this.errorMessage = '';
  }

  getDigit(index: number): string {
    return this.code[index] || '';
  }

  updateDigit(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    if (value.length > 1) {
      this.setCodeFrom(index, value);
      return;
    }

    const digits = this.code.padEnd(6, ' ').split('');
    digits[index] = value || ' ';
    this.code = digits.join('').replace(/\s/g, '').slice(0, 6);
    input.value = value;
    this.errorMessage = '';

    if (value && index < 5) {
      this.focusDigit(index + 1);
    }
  }

  handleDigitKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace' && !input.value && index > 0) {
      event.preventDefault();
      this.removeDigit(index - 1);
      this.focusDigit(index - 1);
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusDigit(index - 1);
    }

    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusDigit(index + 1);
    }
  }

  pasteCode(event: ClipboardEvent, index: number): void {
    const pasted = event.clipboardData?.getData('text') || '';
    const digits = pasted.replace(/\D/g, '');

    if (!digits) {
      return;
    }

    event.preventDefault();
    this.setCodeFrom(index, digits);
  }

  resend(): void {
    if (this.resendSeconds > 0 || this.loading) {
      return;
    }

    this.http.post(`${APP_API_BASE_URL}/auth/mfa/resend`, {
      email: this.flow.email,
      tempToken: this.flow.tempToken,
      method: this.method
    }).subscribe({
      next: () => {
        this.errorMessage = '';
        this.setResendCountdown(60);
        this.startTimer();
      },
      error: err => this.errorMessage = err?.error?.message || 'No se pudo reenviar el codigo.'
    });
  }

  verify(): void {
    if (this.loading) {
      return;
    }

    const code = this.code;

    if (code.length !== 6) {
      this.errorMessage = 'Ingresa los 6 digitos.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.http.post<any>(`${APP_API_BASE_URL}/auth/mfa/verify`, {
      email: this.flow.email,
      tempToken: this.flow.tempToken,
      method: this.method,
      purpose: this.flow.purpose,
      code
    }).subscribe({
      next: res => {
        sessionStorage.removeItem('pending_mfa_flow');
        const login = res?.login;

        if (login?.token) {
          localStorage.setItem(APP_STORAGE_KEYS.token, login.token);
          localStorage.setItem(APP_STORAGE_KEYS.role, this.normalizeRole(login.rol));
          localStorage.setItem('auth_user_email', login.correo || this.flow.email);
          localStorage.setItem('auth_user_id', String(login.idUsuario ?? ''));
        }

        this.router.navigate([res?.redirectTo || this.flow.redirectTo || APP_ROUTE_PATHS.login], { replaceUrl: true });
      },
      error: err => {
        this.loading = false;
        this.code = '';
        this.errorMessage = err?.error?.message || 'Codigo incorrecto o expirado.';
        this.focusDigit(0);
      }
    });
  }

  private setCodeFrom(index: number, value: string): void {
    const digits = this.code.padEnd(6, ' ').split('');
    value.replace(/\D/g, '').slice(0, 6 - index).split('').forEach((digit, offset) => {
      digits[index + offset] = digit;
    });

    this.code = digits.join('').replace(/\s/g, '').slice(0, 6);
    this.errorMessage = '';
    this.focusDigit(Math.min(index + value.length, 5));
  }

  private removeDigit(index: number): void {
    const digits = this.code.padEnd(6, ' ').split('');
    digits[index] = ' ';
    this.code = digits.join('').replace(/\s/g, '').slice(0, 6);
  }

  private focusDigit(index: number): void {
    setTimeout(() => {
      const input = document.getElementById(`mfa-digit-${index}`) as HTMLInputElement | null;
      input?.focus();
      input?.select();
    });
  }

  private normalizeRole(rol: string | null | undefined): string {
    return (rol || '').toUpperCase().replace(/^ROLE_/, '').trim();
  }

  private startTimer(): void {
    this.clearTimer();
    this.timer = setInterval(() => {
      this.syncCountdownsFromStorage();
      if (this.resendSeconds > 0) {
        this.resendSeconds--;
      }

      if (this.expiresSeconds > 0) {
        this.expiresSeconds--;
      }

      if (this.resendSeconds <= 0 && this.expiresSeconds <= 0) {
        this.clearTimer();
      }

      this.cdr.detectChanges();
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private hydrateTimers(): void {
    const now = Date.now();
    const expiresAt = Number(this.flow?.expiresAt || 0);
    const resendAt = Number(this.flow?.resendAt || 0);

    if (expiresAt > now) {
      this.expiresSeconds = Math.ceil((expiresAt - now) / 1000);
    } else {
      this.expiresSeconds = Number(this.flow?.expiresInSeconds || 300);
      this.flow.expiresAt = now + this.expiresSeconds * 1000;
    }

    if (resendAt > now) {
      this.resendSeconds = Math.ceil((resendAt - now) / 1000);
    } else {
      this.setResendCountdown(Number(this.flow?.resendInSeconds || 30));
    }

    sessionStorage.setItem('pending_mfa_flow', JSON.stringify(this.flow));
  }

  private setResendCountdown(seconds: number): void {
    this.resendSeconds = Math.max(0, seconds);
    if (this.flow) {
      this.flow.resendAt = Date.now() + this.resendSeconds * 1000;
      sessionStorage.setItem('pending_mfa_flow', JSON.stringify(this.flow));
    }
  }

  private syncCountdownsFromStorage(): void {
    const now = Date.now();
    this.resendSeconds = Math.max(0, Math.ceil((Number(this.flow?.resendAt || 0) - now) / 1000));
    this.expiresSeconds = Math.max(0, Math.ceil((Number(this.flow?.expiresAt || 0) - now) / 1000));
  }
}
