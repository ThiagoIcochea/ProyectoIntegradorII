// Backend touchpoint: quotation confirmation, company lookup and order creation.

import { CommonModule } from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { FormsModule } from '@angular/forms';

import * as L from 'leaflet';

import {
  APP_API_BASE_URL,
  APP_ROUTE_PATHS,
  APP_STORAGE_KEYS
} from '../../../core/constants/app.constants';

@Component({
  selector: 'app-rfq-quotation',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './rfq-quotation.html',
  styleUrl: './rfq-quotation.scss'
})
export class RfqQuotationComponent implements OnInit {

  provider: any;

  products: any[] = [];

  subtotal = 0;
  igv = 0;
  total = 0;

  fechaValidez = '';

  rucEmpresa = '';

  direccionEntrega = '';

  selectedLocation: {
    lat: number | null;
    lng: number | null;
    address: string;
  } = {
    lat: null,
    lng: null,
    address: ''
  };

  tempLocation: {
    lat: number | null;
    lng: number | null;
    address: string;
  } = {
    lat: null,
    lng: null,
    address: ''
  };

  loading = false;

  resolvingLocationAddress = false;

  // MAPA MODAL
  mostrarMapaModal = false;

  map: any;

  marker: any;

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    const data =
      localStorage.getItem(
        APP_STORAGE_KEYS.selectedProvider
      );

    if (!data) {

      this.router.navigate([
        APP_ROUTE_PATHS.rfqResults
      ]);

      return;
    }

    this.provider = JSON.parse(data);

    this.products =
      this.provider.items ??
      this.provider.itemsDetalle ??
      this.provider.productos ??
      [];

    this.total =
      Number(
        this.provider.totalCotizacion || 0
      );

    this.subtotal =
      Number(
        (this.total / 1.18).toFixed(2)
      );

    this.igv =
      Number(
        (this.total - this.subtotal).toFixed(2)
      );

    const fecha = new Date();

    fecha.setDate(
      fecha.getDate() + 7
    );

    this.fechaValidez =
      fecha.toLocaleDateString('es-PE');
  }

  abrirMapaModal(): void {

    this.mostrarMapaModal = true;
    this.tempLocation = {
      lat: this.selectedLocation.lat,
      lng: this.selectedLocation.lng,
      address: this.selectedLocation.address || this.direccionEntrega
    };
    this.resolvingLocationAddress = false;
    this.cdr.detectChanges();

    setTimeout(() => {

      this.initMap();
      this.refreshMapSize();

    }, 250);
  }

  cerrarMapaModal(): void {

    this.mostrarMapaModal = false;
    this.resolvingLocationAddress = false;

    if (this.map) {

      this.map.remove();

      this.map = null;
    }

    this.marker = null;
    this.cdr.detectChanges();
  }

  confirmarUbicacion(): void {
    this.selectedLocation = {
      lat: this.tempLocation.lat,
      lng: this.tempLocation.lng,
      address: this.tempLocation.address.trim()
    };

    this.direccionEntrega =
      this.selectedLocation.address ||
      this.getLocationCoordinatesLabel(this.selectedLocation);

    this.cerrarMapaModal();
    this.cdr.detectChanges();
  }

  refreshMapSize(): void {
    if (!this.map) return;

    setTimeout(() => {
      this.map.invalidateSize();
    }, 120);
  }

  hasTempLocation(): boolean {
    return this.tempLocation.lat !== null && this.tempLocation.lng !== null;
  }

  getLocationSummary(): string {
    if (this.direccionEntrega) return this.direccionEntrega;

    if (
      this.selectedLocation.lat !== null &&
      this.selectedLocation.lng !== null
    ) {
      return 'Ubicacion seleccionada';
    }

    return 'Selecciona tu ubicacion de entrega';
  }

  getSelectedCoordinatesLabel(): string {
    return this.getLocationCoordinatesLabel(this.selectedLocation);
  }

  getTempCoordinatesLabel(): string {
    return this.getLocationCoordinatesLabel(this.tempLocation);
  }

  private getLocationCoordinatesLabel(
    location: { lat: number | null; lng: number | null }
  ): string {
    if (location.lat === null || location.lng === null) return '';

    return `Lat: ${location.lat.toFixed(5)}, Lng: ${location.lng.toFixed(5)}`;
  }

  initMap(): void {

    if (this.map) {

      this.map.remove();
    }

    this.map =
      L.map('quotationMap', {
        zoomControl: true
      });

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '© OpenStreetMap'
      }
    ).addTo(this.map);

    const initialLat = this.tempLocation.lat;
    const initialLng = this.tempLocation.lng;

    if (initialLat !== null && initialLng !== null) {

      this.map.setView(
        [initialLat, initialLng],
        16
      );

      this.setMapMarker(
        initialLat,
        initialLng
      );

      this.refreshMapSize();

    } else if (navigator.geolocation) {

      navigator.geolocation.getCurrentPosition(

        (pos) => {

          const lat =
            pos.coords.latitude;

          const lng =
            pos.coords.longitude;

          this.map.setView(
            [lat, lng],
            16
          );

          this.setMapMarker(
            lat,
            lng
          );

          this.setTempLocation(
            lat,
            lng
          );

          this.obtenerDireccion(
            lat,
            lng
          );

          this.refreshMapSize();
        },

        () => {

          this.map.setView(
            [-12.0464, -77.0428],
            13
          );

          this.refreshMapSize();
        }
      );

    } else {

      this.map.setView(
        [-12.0464, -77.0428],
        13
      );

      this.refreshMapSize();
    }

    // CLICK EN MAPA
    this.map.on(
      'click',
      (e: any) => {

        const lat =
          e.latlng.lat;

        const lng =
          e.latlng.lng;

        this.onMapClick(
          lat,
          lng
        );
      }
    );

    this.refreshMapSize();
  }

  onMapClick(lat: number, lng: number): void {
    this.setMapMarker(lat, lng);
    this.setTempLocation(lat, lng);
    this.obtenerDireccion(lat, lng);
  }

  setMapMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    this.marker =
      L.marker([lat, lng])
      .addTo(this.map);
  }

  setTempLocation(lat: number, lng: number): void {
    this.tempLocation.lat = lat;
    this.tempLocation.lng = lng;
    this.tempLocation.address = '';
    this.resolvingLocationAddress = true;
    this.cdr.detectChanges();
  }

  obtenerDireccion(
    lat: number,
    lng: number
  ): void {

    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=es&lat=${lat}&lon=${lng}`;

    this.resolvingLocationAddress = true;
    this.cdr.detectChanges();

    this.http.get<any>(url)
    .subscribe({
      next: (res) => {

      const resolvedAddress = this.formatNominatimAddress(res);

      if (resolvedAddress) {
        this.tempLocation.address = resolvedAddress;
        this.resolvingLocationAddress = false;
        this.cdr.detectChanges();
        return;
      }

      this.obtenerDireccionPhoton(lat, lng);
      return;

      if (!res || !res.address) {

        this.tempLocation.address =
          res.display_name ||
          'Ubicación no encontrada';

        this.resolvingLocationAddress = false;
        this.cdr.detectChanges();

        return;
      }

      const a = res.address;

      const calle =
        a.road ||
        a.pedestrian ||
        a.footway ||
        a.street ||
        '';

      const numero =
        a.house_number
          ? ` ${a.house_number}`
          : '';

      const distrito =
        a.suburb ||
        a.city_district ||
        a.city ||
        '';

      const provincia =
        a.county || '';

      const departamento =
        a.state || '';

      this.tempLocation.address =
        `${calle}${numero}, ${distrito}, ${provincia}, ${departamento}`.trim();

      if (
        !calle &&
        !distrito &&
        !provincia &&
        !departamento
      ) {

        this.tempLocation.address =
          res.display_name;
      }

      this.resolvingLocationAddress = false;
      this.cdr.detectChanges();
      },
      error: () => {
        this.obtenerDireccionPhoton(lat, lng);
      }
    });
  }

  private obtenerDireccionPhoton(lat: number, lng: number): void {
    const url =
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=es`;

    this.http.get<any>(url)
    .subscribe({
      next: (res) => {
        this.tempLocation.address =
          this.formatPhotonAddress(res) ||
          'Direccion no disponible';

        this.resolvingLocationAddress = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.tempLocation.address = 'Direccion no disponible';
        this.resolvingLocationAddress = false;
        this.cdr.detectChanges();
      }
    });
  }

  private formatNominatimAddress(res: any): string {
    if (!res) return '';

    const a = res.address || {};
    const calle =
      a.road ||
      a.pedestrian ||
      a.footway ||
      a.street ||
      a.path ||
      a.cycleway ||
      a.neighbourhood ||
      '';
    const numero = a.house_number ? ` ${a.house_number}` : '';
    const distrito =
      a.suburb ||
      a.city_district ||
      a.district ||
      a.town ||
      a.city ||
      '';
    const provincia =
      a.county ||
      a.province ||
      '';
    const departamento =
      a.state ||
      '';
    const parts = [
      `${calle}${numero}`.trim(),
      distrito,
      provincia,
      departamento
    ].filter(Boolean);

    return parts.length ? parts.join(', ') : (res.display_name || '');
  }

  private formatPhotonAddress(res: any): string {
    const properties = res?.features?.[0]?.properties;
    if (!properties) return '';

    const calle =
      properties.street ||
      properties.name ||
      properties.osm_value ||
      '';
    const numero =
      properties.housenumber
        ? ` ${properties.housenumber}`
        : '';
    const distrito =
      properties.district ||
      properties.city ||
      properties.locality ||
      '';
    const provincia =
      properties.county ||
      '';
    const departamento =
      properties.state ||
      '';
    const parts = [
      `${calle}${numero}`.trim(),
      distrito,
      provincia,
      departamento
    ].filter(Boolean);

    return parts.join(', ');
  }

  confirmarOrden(): void {

    if (this.loading) return;

    if (
      !this.rucEmpresa ||
      this.rucEmpresa.length !== 11
    ) {

      alert(
        'Ingrese un RUC válido'
      );

      return;
    }

    if (!this.direccionEntrega) {

      alert(
        'Seleccione una dirección'
      );

      return;
    }

    this.loading = true;

    const token =
      localStorage.getItem(
        APP_STORAGE_KEYS.token
      );

    const headers =
      new HttpHeaders({
        Authorization:
          `Bearer ${token}`
      });

    this.http.post<any>(
      `${APP_API_BASE_URL}/empresas`,
      {
        ruc: this.rucEmpresa
      },
      { headers }
    ).subscribe({

      next: (empresa) => {

        const solicitudBody = {

          idEmpresa:
            empresa.idEmpresa,

          idProveedor:
            this.provider.idProveedor,

          subtotal:
            this.subtotal,

          igv:
            this.igv,

          total:
            this.total,

          direccionEnvio:
            this.direccionEntrega,

          items:
            this.products.map(p => ({

              idProducto:
                p.idProducto,

              cantidad:
                Number(p.cantidad),

              precioUnitario:
                Number(p.precioUnitario)

            }))
        };

        this.http.post(
          `${APP_API_BASE_URL}/solicitudes/crear`,
          solicitudBody,
          { headers }
        ).subscribe({

          next: (res: any) => {

            localStorage.setItem(
              APP_STORAGE_KEYS.currentSolicitudId,
              String(res.idSolicitud)
            );

            localStorage.removeItem(
              APP_STORAGE_KEYS.rfqCart
            );

            localStorage.removeItem(
              APP_STORAGE_KEYS.selectedProvider
            );

            this.loading = false;

            this.router.navigate([
              APP_ROUTE_PATHS.clientRequests
            ]);
          },

          error: () => {

            this.loading = false;

            alert(
              'Error al crear solicitud'
            );
          }
        });
      },

      error: () => {

        this.loading = false;

        alert(
          'Error al registrar empresa'
        );
      }
    });
  }
}
