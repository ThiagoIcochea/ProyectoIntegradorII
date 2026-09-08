import { CommonModule } from '@angular/common';

import {
  HttpClient,
  HttpClientModule,
  HttpHeaders
} from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule
  ],
  templateUrl: './logs.html',
  styleUrl: './logs.scss'
})
export class AdminLogsComponent
implements OnInit {

  private API_URL =
    `${APP_API_BASE_URL}/logs/admin`;

  logs: any[] = [];

  filteredLogs: any[] = [];

  paginatedLogs: any[] = [];

  selectedLog: any = null;

  searchText: string = '';

  currentPage: number = 1;

  itemsPerPage: number = 8;

  totalPages: number = 1;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.obtenerLogs();
  }

  private headers(): HttpHeaders {

    return new HttpHeaders({

      Authorization:
        `Bearer ${localStorage.getItem('token')}`

    });
  }

  obtenerLogs(): void {

    this.http.get<any[]>(
      this.API_URL,
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {

        this.logs = res;

        this.filteredLogs = [...res];

        this.actualizarPaginacion();

        if (
          this.paginatedLogs.length > 0
        ) {

          this.selectedLog =
            this.paginatedLogs[0];
        }

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(
          'Error obteniendo logs',
          err
        );
      }
    });
  }

  seleccionarLog(
    log: any
  ): void {

    this.selectedLog = log;

    this.cdr.detectChanges();
  }

  filtrarLogs(): void {

    const text =
      this.searchText.toLowerCase();

    this.filteredLogs =
      this.logs.filter(log =>

        log?.accion
          ?.toLowerCase()
          .includes(text)

        ||

        log?.modulo
          ?.toLowerCase()
          .includes(text)

        ||

        log?.descripcion
          ?.toLowerCase()
          .includes(text)

        ||

        log?.ip
          ?.toLowerCase()
          .includes(text)
      );

    this.currentPage = 1;

    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {

    this.totalPages = Math.ceil(
      this.filteredLogs.length /
      this.itemsPerPage
    );

    const inicio =
      (this.currentPage - 1)
      * this.itemsPerPage;

    const fin =
      inicio + this.itemsPerPage;

    this.paginatedLogs =
      this.filteredLogs.slice(
        inicio,
        fin
      );

    if (
      this.paginatedLogs.length > 0
    ) {

      this.selectedLog =
        this.paginatedLogs[0];
    }

    this.cdr.detectChanges();
  }

  paginaAnterior(): void {

    if (
      this.currentPage > 1
    ) {

      this.currentPage--;

      this.actualizarPaginacion();
    }
  }

  paginaSiguiente(): void {

    if (
      this.currentPage <
      this.totalPages
    ) {

      this.currentPage++;

      this.actualizarPaginacion();
    }
  }

  exportarLogs(): void {
    const rows = this.filteredLogs.map(log => [
      log?.accion || '',
      log?.modulo || '',
      log?.descripcion || '',
      log?.ip || '',
      log?.fecha || ''
    ]);

    const csv = [
      ['Acción', 'Módulo', 'Descripción', 'IP', 'Fecha'],
      ...rows
    ].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'logs-sistema.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
