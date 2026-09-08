import { CommonModule } from '@angular/common';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnInit
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';
import { MfaService } from '../../../core/services/mfa.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class AdminUsersComponent
implements OnInit {

  private API_URL =
    `${APP_API_BASE_URL}/usuarios/admin/listar`;

  users: any[] = [];

  filteredUsers: any[] = [];

  roles: string[] = [];

  searchTerm: string = '';

  loading: boolean = false;
  saving: boolean = false;
  selectedUser: any | null = null;
  editForm: any = {};
  errorMessage = '';
  readonly skeletonRows = Array.from({ length: 5 });

  constructor(
    private http: HttpClient,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private mfaService: MfaService
  ) {}

  ngOnInit(): void {

    this.listarUsuarios();
    this.cargarRoles();

  }

  private headers(): HttpHeaders {

    return new HttpHeaders({

      Authorization:
        `Bearer ${localStorage.getItem('token')}`

    });
  }

  listarUsuarios(): void {

    this.loading = true;

    this.http.get<any[]>(
      this.API_URL,
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {

        this.zone.run(() => {

          const usuarios =
            (res || []).filter(

              u =>

                u?.rol !== 'ADMIN'

            );

          this.users = [...usuarios];

          this.filteredUsers =
            [...usuarios];

          this.loading = false;

          this.cdr.detectChanges();

        });

      },

      error: (err) => {

        console.error(err);

        this.loading = false;

        this.cdr.detectChanges();

      }
    });
  }

  private cargarRoles(): void {
    this.http.get<string[]>(
      `${APP_API_BASE_URL}/usuarios/roles`,
      { headers: this.headers() }
    ).subscribe({
      next: (roles) => {
        this.roles = Array.isArray(roles) ? roles : [];
        if (this.roles.length === 0) {
          this.roles = ['CLIENTE', 'PROVEEDOR'];
        }
      },
      error: () => {
        this.roles = ['CLIENTE', 'PROVEEDOR'];
      }
    });
  }

  filtrarUsuarios(): void {

    const texto =
      this.searchTerm
      .toLowerCase()
      .trim();

    if (!texto) {

      this.filteredUsers =
        [...this.users];

      this.cdr.detectChanges();

      return;
    }

    this.filteredUsers =
      this.users.filter(user =>

        user?.nombreCompleto
          ?.toLowerCase()
          .includes(texto)

        ||

        user?.correo
          ?.toLowerCase()
          .includes(texto)

        ||

        user?.rol
          ?.toLowerCase()
          .includes(texto)

      );

    this.cdr.detectChanges();
  }

  getTotalUsuarios(): number {

    return this.filteredUsers.length;
  }

  getClientes(): number {

    return this.filteredUsers.filter(

      u =>

        u?.rol?.toUpperCase()
        === 'CLIENTE'

    ).length;
  }

  getProveedores(): number {

    return this.filteredUsers.filter(

      u =>

        u?.rol?.toUpperCase()
        === 'PROVEEDOR'

    ).length;
  }

  getSuspendidos(): number {

    return this.filteredUsers.filter(

      u =>

        ['SUSPENDIDO', 'BLOQUEADO'].includes(u?.estado?.toUpperCase())

    ).length;
  }

  formatearFecha(
    fecha: string
  ): string {

    if (!fecha) {

      return '';

    }

    return new Date(fecha)
      .toLocaleDateString(
        'es-PE',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }
      );
  }

  gestionar(user: any): void {
    this.selectedUser = user;
    this.errorMessage = '';
    const rolActual = this.normalizarRol(user?.rol || user?.rolNombre || 'CLIENTE');
    this.editForm = {
      nombres: user?.nombres || this.splitName(user?.nombreCompleto).nombres,
      apellidos: user?.apellidos || this.splitName(user?.nombreCompleto).apellidos,
      correo: user?.correo || '',
      telefono: user?.telefono || '',
      whatsapp: user?.whatsapp || '',
      direccion: user?.direccion || '',
      password: '',
      estado: this.normalizarEstado(user?.estado),
      rol: rolActual
    };

    if (user?.idUsuario === 0 && !this.roles.includes(rolActual)) {
      this.editForm.rol = this.roles.length > 0 ? this.roles[0] : 'CLIENTE';
    }
  }

  cerrarGestion(): void {
    this.selectedUser = null;
    this.editForm = {};
    this.errorMessage = '';
  }

  async crearNuevoUsuario(): Promise<void> {
    const form = {
      nombres: this.editForm?.nombres || '',
      apellidos: this.editForm?.apellidos || '',
      correo: this.editForm?.correo || '',
      telefono: this.editForm?.telefono || '',
      whatsapp: this.editForm?.whatsapp || '',
      direccion: this.editForm?.direccion || '',
      password: this.editForm?.password || '',
      estado: this.editForm?.estado || 'ACTIVO',
      rol: this.editForm?.rol || 'CLIENTE'
    };

    if (!form.correo || !form.password || !form.nombres || !form.apellidos) {
      this.errorMessage = 'Completa nombres, apellidos, correo y contraseña.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    try {
      const adminEmail = localStorage.getItem('auth_user_email') || '';
      const token = await this.mfaService.requestActionToken(adminEmail, 'ADMIN_ACTION');
      this.http.post<any>(
        `${APP_API_BASE_URL}/usuarios/admin`,
        form,
        {
          headers: this.headers().set('X-MFA-Authorization', token)
        }
      ).subscribe({
        next: () => {
          this.saving = false;
          this.cerrarGestion();
          this.listarUsuarios();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'No se pudo crear el usuario.';
          this.cdr.detectChanges();
        }
      });
    } catch (error: any) {
      this.saving = false;
      this.errorMessage = error?.message || 'MFA cancelado.';
      this.cdr.detectChanges();
    }
  }

  async guardarGestion(): Promise<void> {
    if (!this.selectedUser || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    try {
      const adminEmail = localStorage.getItem('auth_user_email') || '';
      const token = await this.mfaService.requestActionToken(adminEmail, 'ADMIN_ACTION');
      const body = { ...this.editForm };

      delete body.rol;

      if (!body.password) {
        delete body.password;
      }

      this.http.put<any>(
        `${APP_API_BASE_URL}/usuarios/admin/${this.selectedUser.idUsuario}`,
        body,
        {
          headers: this.headers().set('X-MFA-Authorization', token)
        }
      ).subscribe({
        next: updated => {
          this.saving = false;
          this.users = this.users.map(user => user.idUsuario === updated.idUsuario ? updated : user);
          this.filtrarUsuarios();
          this.cerrarGestion();
          this.cdr.detectChanges();
        },
        error: err => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'No se pudo guardar el usuario.';
          this.cdr.detectChanges();
        }
      });
    } catch (error: any) {
      this.saving = false;
      this.errorMessage = error?.message || 'MFA cancelado.';
      this.cdr.detectChanges();
    }
  }

  activarUsuario(): void {
    this.editForm.estado = 'ACTIVO';
  }

  private normalizarRol(rol: unknown): string {
    const raw = String(rol ?? '').trim().toUpperCase();
    if (raw.includes('ADMIN')) {
      return 'ADMIN';
    }
    if (raw.includes('PROVEEDOR')) {
      return 'PROVEEDOR';
    }
    return 'CLIENTE';
  }

  private normalizarEstado(estado: unknown): string {
    const raw = String(estado ?? '').trim().toUpperCase();
    if (['INACTIVO', 'SUSPENDIDO', 'BLOQUEADO'].includes(raw)) {
      return 'INACTIVO';
    }
    return 'ACTIVO';
  }

  private splitName(value: string): { nombres: string; apellidos: string } {
    const parts = String(value || '').trim().split(/\s+/);
    return {
      nombres: parts.slice(0, 2).join(' '),
      apellidos: parts.slice(2).join(' ')
    };
  }
}
