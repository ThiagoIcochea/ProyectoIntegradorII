import { RucLookupComponent, EmpresaRuc } from '../../../shared/ruc-lookup/ruc-lookup';
// Backend touchpoint: profile data loader and updater; RUC fields are provider-only.
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';
import { MfaService } from '../../../core/services/mfa.service';
import { extractValidationMessage } from '../../../core/utils/form-validation';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RucLookupComponent, CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {

  rucConfirmado = '';
  completarEmpresa(datos: EmpresaRuc | null): void {
    this.rucConfirmado = datos?.ruc || '';
    this.usuario.razonSocial = datos?.razonSocial || '';
    this.usuario.descripcion = datos?.descripcion || '';
  }

  private readonly validators = {
    name: /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    phone: /^(?:\+51\s?)?9\d{8}$/,
    ruc: /^(10|20)\d{9}$/,
    razonSocial: /^[A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .,&-]{2,119}$/,
    address: /^[A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .,#°º/-]{4,149}$/,
    description: /^[A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .,#°º/&()-]{9,399}$/,
    url: /^https?:\/\/\S+\.\S+$/
  };

  usuario: any = {
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    whatsapp: '',
    direccion: '',
    razonSocial: '',
    ruc: '',
    descripcion: '',
    rol: '',
    fotoPerfil: '',
    preferencias: {
      notificaciones: true,
      entregaRapida: false
    }
  };

  previewFoto: string | null = null;

  archivoFoto: File | null = null;

  nombreArchivoFoto: string = '';

  fotoUrl: string = '';

  modoImagen: string = 'archivo';

  mostrarIniciales: boolean = false;

  iniciales: string = '';

  private voiceProfilePatchHandler = (event: Event): void => {
    const detail = (event as CustomEvent).detail || {};
    const patch = detail.profile || { [detail.field]: detail.value };

    this.usuario = {
      ...this.usuario,
      ...patch,
      preferencias: patch.preferencias || this.usuario.preferencias || {
        notificaciones: true,
        entregaRapida: false
      }
    };

    this.generarIniciales();
    this.cdr.detectChanges();
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private mfaService: MfaService
  ) {}

  get esProveedor(): boolean {
    return (this.usuario.rol || localStorage.getItem(APP_STORAGE_KEYS.role) || '').toUpperCase() === 'PROVEEDOR';
  }

  get rolTexto(): string {

    const rol = (this.usuario.rol || localStorage.getItem(APP_STORAGE_KEYS.role) || '').toUpperCase();

    if (rol === 'ADMIN') {
      return 'Administrador';
    }

    if (rol === 'PROVEEDOR') {
      return 'Proveedor';
    }

    return 'Cliente';
  }

  ngOnInit(): void {
    window.addEventListener('voiceProfilePatch', this.voiceProfilePatchHandler);
    this.cargarPerfil();
  }

  ngOnDestroy(): void {
    window.removeEventListener('voiceProfilePatch', this.voiceProfilePatchHandler);
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

  cargarPerfil(notifyProfileUpdated = false): void {

    this.http.get<any>(
      `${APP_API_BASE_URL}/usuarios/perfil`,
      {
        headers: this.headers()
      }
    ).subscribe({

      next: (res) => {

        this.usuario = res;

        this.usuario.preferencias = {
          notificaciones: this.usuario.notificacionesRfq ?? this.usuario.preferencias?.notificaciones ?? true,
          entregaRapida: this.usuario.entregaRapida ?? this.usuario.preferencias?.entregaRapida ?? false
        };

        this.generarIniciales();

        if (this.usuario.fotoPerfil) {

          this.previewFoto =
            this.usuario.fotoPerfil + '?t=' + Date.now();

          this.mostrarIniciales = false;

        } else {

          this.previewFoto = null;
          this.mostrarIniciales = true;
        }

        if (notifyProfileUpdated) {
          window.dispatchEvent(
            new CustomEvent('profileUpdated', {
              detail: this.usuario
            })
          );
        }

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(err);
      }
    });
  }

  generarIniciales(): void {

    const nombres = this.usuario.nombres || '';
    const apellidos = this.usuario.apellidos || '';

    const n1 = nombres.charAt(0).toUpperCase();
    const a1 = apellidos.charAt(0).toUpperCase();

    this.iniciales = `${n1}${a1}`.trim();

    if (!this.iniciales) {
      this.iniciales = 'U';
    }
  }

  onImageError(): void {

    this.previewFoto = null;
    this.mostrarIniciales = true;

    this.cdr.detectChanges();
  }

  seleccionarFoto(event: any): void {

    const file = event.target.files[0];

    if (!file) return;

    this.archivoFoto = file;
    this.nombreArchivoFoto = file.name;

    const reader = new FileReader();

    reader.onload = () => {

      this.previewFoto = reader.result as string;

      this.mostrarIniciales = false;

      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  async guardarPerfil(): Promise<void> {
    const validationError = this.validateProfile();
    if (validationError) {
      await Swal.fire({ icon: 'warning', title: 'Datos incompletos', text: validationError });
      return;
    }

    const formData = new FormData();

    formData.append('nombres', this.usuario.nombres || '');
    formData.append('apellidos', this.usuario.apellidos || '');
    formData.append('correo', this.usuario.correo || '');
    formData.append('telefono', this.usuario.telefono || '');
    formData.append('whatsapp', this.usuario.whatsapp || '');
    formData.append('direccion', this.usuario.direccion || '');

    formData.append(
      'notificaciones',
      String(this.usuario.preferencias.notificaciones)
    );

    formData.append(
      'entregaRapida',
      String(this.usuario.preferencias.entregaRapida)
    );

    if (this.esProveedor) {

      formData.append(
        'razonSocial',
        this.usuario.razonSocial || ''
      );

      formData.append(
        'ruc',
        this.usuario.ruc || ''
      );

      formData.append(
        'descripcion',
        this.usuario.descripcion || ''
      );
    }

    if (this.archivoFoto) {

      formData.append('foto', this.archivoFoto);

    } else if (this.fotoUrl) {

      formData.append('fotoUrl', this.fotoUrl);
    }

    let mfaToken = '';

    try {
      mfaToken = await this.mfaService.requestActionToken(
        localStorage.getItem('auth_user_email') || this.usuario.correo || '',
        'PROFILE_UPDATE'
      );
    } catch (error: any) {
      await Swal.fire({
        icon: 'warning',
        title: 'Verificación cancelada',
        text: error?.message || 'No se completo la verificacion multifactor.'
      });
      return;
    }

    this.http.put(
      `${APP_API_BASE_URL}/usuarios/perfil`,
      formData,
      {
        headers: this.headers().set('X-MFA-Authorization', mfaToken)
      }
    ).subscribe({

      next: async () => {
        this.archivoFoto = null;
        this.nombreArchivoFoto = '';
        this.fotoUrl = '';

        await Swal.fire({ icon: 'success', title: 'Perfil actualizado', text: 'Tu información se guardó correctamente.' });
        this.cargarPerfil(true);
      },

      error: async (err) => {
        console.error(err);
        await Swal.fire({
          icon: 'error',
          title: 'No se pudo actualizar',
          text: extractValidationMessage(err, 'No se pudo actualizar el perfil.')
        });
      }
    });
  }


  private validateProfile(): string {
    const phone = this.onlyDigits(this.usuario.telefono);
    const whatsapp = this.onlyDigits(this.usuario.whatsapp);

    if (!this.validators.name.test(this.usuario.nombres || '')) {
      return 'Nombres invalido: debe iniciar con mayuscula y usar solo letras. Ejemplo: Juan Carlos.';
    }

    if (this.usuario.apellidos && this.usuario.apellidos.trim() && !this.validators.name.test(this.usuario.apellidos)) {
      return 'Apellidos invalido: debe iniciar con mayuscula y usar solo letras. Ejemplo: Perez Ramos.';
    }

    if (!this.validators.email.test(this.usuario.correo || '')) {
      return 'Correo invalido: usa un formato como usuario@empresa.com.';
    }

    if (!this.validators.phone.test(phone)) {
      return 'Telefono invalido: debe ser celular peruano de 9 digitos e iniciar con 9. Ejemplo: 987654321.';
    }

    if (!this.validators.phone.test(whatsapp)) {
      return 'WhatsApp invalido: debe ser celular peruano de 9 digitos e iniciar con 9. Ejemplo: 987654321.';
    }

    if (!this.validators.address.test(this.usuario.direccion || '')) {
      return 'Direccion invalida: debe iniciar con mayuscula o numero y tener al menos 5 caracteres.';
    }

    if (this.esProveedor) {
      if (!this.validators.ruc.test(this.usuario.ruc || '')) {
        return 'RUC invalido: debe tener 11 digitos y empezar con 10 o 20.';
      }

      if (this.rucConfirmado !== this.usuario.ruc || !this.rucConfirmado) {
        return 'Espera a que se consulte correctamente el RUC.';
      }

    }

    if (this.modoImagen === 'url' && this.fotoUrl && !this.validators.url.test(this.fotoUrl)) {
      return 'URL de foto invalida: debe iniciar con http:// o https://.';
    }

    this.usuario.telefono = phone;
    this.usuario.whatsapp = whatsapp;
    return '';
  }

  private onlyDigits(value: string): string {
    return String(value || '').replace(/\D/g, '');
  }
}
