import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-rfq-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rfq-catalog.html',
  styleUrl: './rfq-catalog.scss'
})
export class RfqCatalogComponent implements OnInit, OnDestroy {

  products: any[] = [];
  productsOriginal: any[] = [];
  requestItems: any[] = [];

  filtros: any = {
    categorias: [],
    marcas: []
  };

  mostrarSolicitudMovil = false;
  mostrarFiltros = false;

  loadingProducts = true;
  loadingFilters = true;
  searchingProviders = false;
  loadingTopProviders = false;
  topProvidersLoaded = false;

  searchTerm = '';

  activeTab: 'productos' | 'proveedores' = 'productos';

  topProviders: any[] = [];

  readonly skeletonCards = Array.from({ length: 8 });

  imageLoadFailures: { [key: number]: boolean } = {};

  selectedCategories: number[] = [];
  selectedBrands: number[] = [];

  specsPorCategoria: { [key: number]: string } = {};

  precioMin: number | null = null;
  precioMax: number | null = null;

  prioridad: string = 'BALANCEADO';

  currentPage: number = 1;
  pageSize: number = 8;

  private readonly API_BASE = APP_API_BASE_URL;
  private productsRequest?: Subscription;
  private voiceCartUpdatedHandler = (event: Event) => {
    const cart = (event as CustomEvent<any[]>).detail;
    this.requestItems = Array.isArray(cart) ? cart : [];
    this.cdr.detectChanges();
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    window.addEventListener('voiceCartUpdated', this.voiceCartUpdatedHandler);

    this.cargarCarritoLocal();

    this.route.queryParamMap.subscribe(params => {

      this.searchTerm = params.get('search')?.trim() || '';
      const tab = params.get('tab');

      if (tab === 'proveedores') {
        this.activeTab = 'proveedores';
        this.ensureTopProvidersLoaded();
      }

      this.currentPage = 1;

      this.aplicarBusquedaLocal();

    });

    this.cargarFiltrosDisponibles();
    this.cargarPreferenciasCliente();

    this.aplicarFiltrosRefinado();

  }

  ngOnDestroy(): void {
    window.removeEventListener('voiceCartUpdated', this.voiceCartUpdatedHandler);
    this.productsRequest?.unsubscribe();
  }

  private getHeaders(): HttpHeaders {

    const token = localStorage.getItem(APP_STORAGE_KEYS.token);

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  cargarCarritoLocal(): void {

    const saved = localStorage.getItem(APP_STORAGE_KEYS.rfqCart);

    if (saved) {
      this.requestItems = JSON.parse(saved);
    }
  }

  guardarCarritoLocal(): void {

    localStorage.setItem(
      APP_STORAGE_KEYS.rfqCart,
      JSON.stringify(this.requestItems)
    );
  }

  private cargarPreferenciasCliente(): void {
    this.http.get<any>(
      `${this.API_BASE}/usuarios/perfil`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        const entregaRapida = res?.entregaRapida ?? res?.preferencias?.entregaRapida ?? false;
        this.prioridad = entregaRapida ? 'TIEMPO' : 'BALANCEADO';
      },
      error: () => {
        // No ocean
      }
    });
  }

  cargarFiltrosDisponibles(): void {

    this.loadingFilters = true;

    this.http.get<any>(
      `${this.API_BASE}/productos/filtros`,
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (res) => {

        this.filtros = res;

        this.loadingFilters = false;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error('Error al cargar filtros', err);

        this.loadingFilters = false;

        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltrosRefinado(): void {

    this.loadingProducts = true;

    const listaSpecs = Object.values(this.specsPorCategoria).filter(
      s => s && s.trim() !== ''
    );

    const body = {
      categorias: this.selectedCategories.length > 0
        ? this.selectedCategories
        : null,

      marcas: this.selectedBrands.length > 0
        ? this.selectedBrands
        : null,

      especificaciones: listaSpecs
    };

    this.productsRequest?.unsubscribe();
    this.productsRequest = this.http.post<unknown[]>(
      `${this.API_BASE}/productos/catalogo/filtrado`,
      body,
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (res) => {

        this.productsOriginal = Array.isArray(res) ? res : [];

        this.aplicarBusquedaLocal();

        this.currentPage = 1;

        this.loadingProducts = false;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error('Error al filtrar', err);

        this.products = [];

        this.productsOriginal = [];

        this.loadingProducts = false;

        this.cdr.detectChanges();
      }
    });
  }

  aplicarBusquedaLocal(): void {

    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {

      this.products = [...this.productsOriginal];

      this.currentPage = 1;

      this.cdr.detectChanges();

      return;
    }

    this.products = this.productsOriginal.filter(product => {

      const specs = (product.especificaciones || [])
        .map((spec: any) => `${spec?.nombre || ''} ${spec?.valor || ''}`)
        .join(' ');

      return [
        product.producto,
        product.marca,
        product.categoria,
        product.descripcion,
        specs
      ]
      .filter(Boolean)
      .some(value =>
        String(value).toLowerCase().includes(term)
      );
    });

    this.currentPage = 1;

    this.cdr.detectChanges();
  }

  toggleFiltro(tipo: 'cat' | 'marca', id: number): void {

    const list = tipo === 'cat'
      ? this.selectedCategories
      : this.selectedBrands;

    const index = list.indexOf(id);

    if (index > -1) {

      list.splice(index, 1);

      if (tipo === 'cat') {
        delete this.specsPorCategoria[id];
      }

    } else {

      list.push(id);
    }
  }

  get totalPages(): number {

    return Math.ceil(this.products.length / this.pageSize);
  }

  get paginatedProducts(): any[] {

    const start = (this.currentPage - 1) * this.pageSize;

    return this.products.slice(start, start + this.pageSize);
  }

  nextPage(): void {

    if (this.currentPage < this.totalPages) {

      this.currentPage++;

      window.scrollTo(0, 0);
    }
  }

  prevPage(): void {

    if (this.currentPage > 1) {

      this.currentPage--;

      window.scrollTo(0, 0);
    }
  }

  verDetalle(product: any): void {

    this.router.navigate(
      ['/app/rfq/product', product.idProducto],
      {
        state: { product }
      }
    );
  }

  agregarProducto(product: any): void {

    const existe = this.requestItems.find(
      x => x.idProducto === product.idProducto
    );

    if (!existe) {

      this.requestItems.push({
        idProducto: product.idProducto,
        name: product.producto,
        detail: `${product.marca} - ${product.descripcion?.substring(0, 30)}...`,
        qty: 1,
        precioReferencia: product.precioUnitario ?? null,
        categoria: product.categoria,
        marca: product.marca
      });

    } else {

      existe.qty++;
    }

    this.guardarCarritoLocal();

    this.cdr.detectChanges();
  }

  aumentar(item: any): void {

    item.qty++;

    this.guardarCarritoLocal();
  }

  disminuir(item: any): void {

    if (item.qty > 1) {

      item.qty--;

    } else {

      this.eliminarDelCarrito(item);
    }

    this.guardarCarritoLocal();
  }

  eliminarDelCarrito(item: any): void {

    this.requestItems = this.requestItems.filter(
      i => i.idProducto !== item.idProducto
    );

    this.guardarCarritoLocal();

    this.cdr.detectChanges();
  }

  toggleSolicitudMovil(): void {

    this.mostrarSolicitudMovil = !this.mostrarSolicitudMovil;
  }

  cerrarSolicitudMovil(): void {

    this.mostrarSolicitudMovil = false;
  }

  buscarProveedoresRFQ(): void {

    if (this.searchingProviders) {
      return;
    }

    this.searchingProviders = true;

    const request = {

      items: this.requestItems.map(i => ({
        idProducto: i.idProducto,
        cantidad: i.qty
      })),

      filtro: {
        precioMin: this.precioMin,
        precioMax: this.precioMax,
        marcas: this.selectedBrands,
        categorias: this.selectedCategories
      },

      prioridad: this.prioridad
    };

    this.http.post(
      `${this.API_BASE}/rfq/buscar-proveedores`,
      request,
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (res: any) => {

        this.router.navigate(
          ['/app/rfq/results'],
          {
            state: { proveedores: res }
          }
        );
      },

      error: (err) => {

        console.error('Error al buscar proveedores', err);

        this.searchingProviders = false;

        this.cdr.detectChanges();

        alert('No se encontraron proveedores.');
      }
    });
  }

  get activeFilterCount(): number {

    const specsActivas = Object.values(this.specsPorCategoria)
      .filter(spec => spec && spec.trim() !== '')
      .length;

    return this.selectedCategories.length
      + this.selectedBrands.length
      + specsActivas;
  }

  get hasActiveFilters(): boolean {

    return this.activeFilterCount > 0;
  }

  toggleFiltros(): void {

    this.mostrarFiltros = !this.mostrarFiltros;
  }

  cerrarFiltros(): void {

    this.mostrarFiltros = false;
  }

  aplicarFiltrosDesdePanel(): void {

    this.aplicarFiltrosRefinado();

    this.cerrarFiltros();
  }

  limpiarFiltros(): void {

    this.selectedCategories = [];

    this.selectedBrands = [];

    this.specsPorCategoria = {};

    this.currentPage = 1;

    this.aplicarFiltrosRefinado();

    this.cerrarFiltros();
  }

  setActiveTab(tab: 'productos' | 'proveedores'): void {

    this.activeTab = tab;

    if (tab === 'proveedores') {
      this.ensureTopProvidersLoaded();
    }

    this.cdr.detectChanges();
  }

  verResenasProveedor(proveedor: any): void {

    this.router.navigate(
      ['/app/rfq/provider-reviews'],
      {
        state: {
          proveedor
        }
      }
    );
  }

  private ensureTopProvidersLoaded(): void {

    if (this.topProvidersLoaded || this.loadingTopProviders) {

      return;

    }

    this.actualizarTopProviders();

  }

  private actualizarTopProviders(): void {

    this.loadingTopProviders = true;

    this.http.get<any[]>(
      `${this.API_BASE}/provider/proveedores/top`,
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (res) => {

        const data = Array.isArray(res) ? res : [];

        this.topProviders = data.map((item: any, index: number) => {

          const likes = Number(
            item.likes
            ?? item.totalLikes
            ?? item.total_likes
            ?? 0
          );

          const dislikes = Number(
            item.dislikes
            ?? item.totalDislikes
            ?? item.total_dislikes
            ?? 0
          );

          const total = likes + dislikes;

          const satisfaccion = total > 0
            ? Math.round((likes / total) * 100)
            : 0;

          return {

            ...item,

            ranking:
              item.ranking
              ?? item.rank
              ?? item.posicion
              ?? (index + 1),

            idProveedor:
              item.idProveedor
              ?? item.id_proveedor
              ?? item.id,

            razonSocial:
              item.razonSocial
              ?? item.razon_social
              ?? item.nombreProveedor
              ?? item.nombre_proveedor
              ?? item.nombre,

            categoriaPrincipal:
              item.categoriaPrincipal
              ?? item.categoria_principal
              ?? item.categoria
              ?? item.rubro,

            pedidosCompletados:
              item.pedidosCompletados
              ?? item.pedidos_completados
              ?? 0,

            cumplimiento:
              item.cumplimiento
              ?? item.porcentajeCumplimiento
              ?? item.cumplimiento_entrega
              ?? 0,

            entregasATiempo:
              item.entregasATiempo
              ?? item.entregas_a_tiempo
              ?? 0,

            tiempoEntregaPromedio:
              item.tiempoEntregaPromedio
              ?? item.tiempo_entrega_promedio
              ?? 0,

            tiempoRespuesta:
              item.tiempoRespuesta
              ?? item.tiempo_respuesta
              ?? 'No disponible',

            totalResenas:
              item.totalResenas
              ?? item.total_resenas
              ?? item.cantidadReviews
              ?? item.totalComentarios
              ?? 0,

            likes,

            dislikes,

            satisfaccion,

            verificado:
              item.verificado
              ?? item.verified
              ?? false,

            descripcion:
              item.descripcion
              ?? item.description
              ?? '',

            
          };
        });

        this.loadingTopProviders = false;
        this.topProvidersLoaded = true;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error('Error cargando top proveedores', err);

        this.topProviders = [];

        this.loadingTopProviders = false;
        this.topProvidersLoaded = false;

        this.cdr.detectChanges();
      }
    });
  }

  getTopProviderProgress(value: number | null | undefined): number {

    if (value === null || value === undefined) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(100, Math.round(Number(value)))
    );
  }

  formatPercent(value: number | null | undefined): string {

    if (value === null || value === undefined) {
      return '0%';
    }

    return `${this.getTopProviderProgress(value)}%`;
  }

  getScorePercent(value: number | null | undefined): string {
    const normalized = Number(value ?? 0);
    const percentage = Math.max(0, Math.min(100, Math.round(normalized * 100)));
    return `${percentage}%`;
  }

  formatDays(value: number | null | undefined): string {

    if (value === null || value === undefined) {
      return '0 dias';
    }

    const rounded = Math.round(Number(value) * 10) / 10;

    return `${rounded} dia${rounded === 1 ? '' : 's'}`;
  }

  getProductImage(product: any): string | null {

    const productId = product?.idProducto;

    if (
      productId &&
      this.imageLoadFailures[productId]
    ) {
      return null;
    }

    const img = product?.imagenes?.[0];

    return img?.URL || img?.url || null;
  }

  markImageAsFailed(product: any): void {

    if (product?.idProducto) {

      this.imageLoadFailures[product.idProducto] = true;

      this.cdr.detectChanges();
    }
  }

  getPrimarySpec(product: any): any | null {

    return product?.especificaciones?.find(
      (spec: any) => spec?.nombre || spec?.valor
    ) ?? null;
  }
}
