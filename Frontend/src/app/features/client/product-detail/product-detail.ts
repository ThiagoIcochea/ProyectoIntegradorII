import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

type ProductDetailTab = 'specs' | 'delivery' | 'providers';

interface DetailCard {
  label: string;
  value: string;
  hint?: string;
}

interface RfqSignal {
  title: string;
  text: string;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss'
})
export class ProductDetailComponent implements OnInit {

  product: any = null;
  requestItems: any[] = [];
  selectedImageIndex: number = 0;
  qty: number = 1;
  activeTab: ProductDetailTab = 'specs';
  loading: boolean = true;
  imageZoomed: boolean = false;
  imageLoadFailures: { [key: string]: boolean } = {};

  private readonly API_BASE = APP_API_BASE_URL;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCarritoLocal();

    // El producto puede venir por state (navegación desde catálogo)
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state?.['product']
      ?? history.state?.['product'];

    if (state) {
      this.product = state;
      this.loading = false;
      this.cdr.detectChanges();
    } else {
      // Fallback: cargar por ID desde la ruta
      const id = this.route.snapshot.paramMap.get('id');
      if (id) this.cargarProductoPorId(Number(id));
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(APP_STORAGE_KEYS.token);
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  cargarCarritoLocal(): void {
    const saved = localStorage.getItem(APP_STORAGE_KEYS.rfqCart);
    if (saved) this.requestItems = JSON.parse(saved);
  }

  guardarCarritoLocal(): void {
    localStorage.setItem(APP_STORAGE_KEYS.rfqCart, JSON.stringify(this.requestItems));
  }

  // Carga el producto filtrando por ID cuando no viene por state
  cargarProductoPorId(id: number): void {
    this.loading = true;
    this.http.post<any[]>(
      `${this.API_BASE}/productos/catalogo/filtrado`,
      { categorias: null, marcas: null, especificaciones: [] },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.product = res.find(p => p.idProducto === id) ?? null;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Galería ────────────────────────────────────────────────
  get imagenes(): string[] {
    const imgs = this.product?.imagenes ?? [];
    return imgs
      .map((i: any) => i.URL ?? i.url)
      .filter((url: string | null | undefined): url is string => !!url && !this.imageLoadFailures[url]);
  }

  get imagenActiva(): string | null {
    return this.imagenes[this.selectedImageIndex] ?? this.imagenes[0] ?? null;
  }

  handleImageError(url: string | null): void {
    if (!url) return;
    this.imageLoadFailures[url] = true;
    this.selectedImageIndex = 0;
    this.cdr.detectChanges();
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  toggleZoom(): void {
    this.imageZoomed = !this.imageZoomed;
  }

  // ── Tabs ───────────────────────────────────────────────────
  setTab(tab: ProductDetailTab): void {
    this.activeTab = tab;
  }

  // ── Cantidad ───────────────────────────────────────────────
  aumentarQty(): void { this.qty++; }
  disminuirQty(): void { if (this.qty > 1) this.qty--; }

  // ── Carrito ────────────────────────────────────────────────
  get yaEnCarrito(): boolean {
    return this.requestItems.some(x => x.idProducto === this.product?.idProducto);
  }

  agregarAlCarrito(): void {
    if (!this.product) return;
    const existe = this.requestItems.find(x => x.idProducto === this.product.idProducto);
    if (!existe) {
      this.requestItems.push({
        idProducto: this.product.idProducto,
        name: this.product.producto,
        detail: `${this.product.marca} - ${this.product.descripcion?.substring(0, 30)}...`,
        qty: this.qty,
        precioReferencia: this.product.precioUnitario ?? null,
        categoria: this.product.categoria,
        marca: this.product.marca
      });
    } else {
      existe.qty += this.qty;
    }
    this.guardarCarritoLocal();
    this.cdr.detectChanges();
  }

  irAlCarrito(): void {
    this.router.navigate(['/app/rfq/catalog']);
  }

  // ── Helpers de display ─────────────────────────────────────
  get especificaciones(): any[] {
    return Array.isArray(this.product?.especificaciones)
      ? this.product.especificaciones
      : [];
  }

  get specsDestacadas(): any[] {
    return this.especificaciones
      .filter((spec: any) => spec?.nombre || spec?.valor)
      .slice(0, 6);
  }

  get resumenCards(): DetailCard[] {
    if (!this.product) return [];

    return [
      {
        label: 'Marca',
        value: this.displayValue(this.product.marca),
        hint: 'Fabricante o linea comercial'
      },
      {
        label: 'Categoria',
        value: this.displayValue(this.product.categoria),
        hint: 'Familia para filtrar proveedores'
      },
      {
        label: 'Ficha tecnica',
        value: `${this.especificaciones.length} dato${this.especificaciones.length === 1 ? '' : 's'}`,
        hint: this.especificaciones.length ? 'Especificaciones disponibles' : 'Pendiente de completar'
      },
      {
        label: 'Galeria',
        value: `${this.imagenes.length || 0} imagen${this.imagenes.length === 1 ? '' : 'es'}`,
        hint: this.imagenes.length ? 'Material visual disponible' : 'Sin imagen cargada'
      }
    ];
  }

  get rfqSignals(): RfqSignal[] {
    const deliveryText = this.product?.tiempoEntregaDias != null
      ? `Entrega estimada de ${this.product.tiempoEntregaDias} dias habiles.`
      : 'La entrega se confirma al comparar proveedores.';

    const warrantyText = this.product?.garantiaMeses != null
      ? `Garantia referencial de ${this.product.garantiaMeses} meses.`
      : 'La garantia se valida dentro de la cotizacion.';

    return [
      {
        title: 'Comparacion preparada',
        text: 'Agrega el producto a tu solicitud y evalua proveedores con resenas y metricas comerciales.'
      },
      {
        title: 'Condiciones comerciales',
        text: deliveryText
      },
      {
        title: 'Validacion de compra',
        text: warrantyText
      }
    ];
  }

  get hasDeliveryInfo(): boolean {
    return this.product?.tiempoEntregaDias != null
      || this.product?.garantiaMeses != null
      || !!this.product?.estado;
  }

  get precioReferenciaLabel(): string | null {
    const price = this.product?.precioUnitario ?? this.product?.precioReferencia;

    if (price === null || price === undefined || price === '') {
      return null;
    }

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice)) {
      return String(price);
    }

    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      maximumFractionDigits: 2
    }).format(numericPrice);
  }

  get fichaCompletaPercent(): number {
    const checks = [
      !!this.product?.producto,
      !!this.product?.descripcion,
      !!this.product?.marca,
      !!this.product?.categoria,
      this.especificaciones.length > 0,
      this.imagenes.length > 0
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }

  displayValue(value: unknown, fallback = 'Por confirmar'): string {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
  }

  // Navega a provider-reviews pasando el producto como state
  verResenasProveedores(): void {
  const idProducto = this.product?.idProducto || this.product?.id_producto;

  if (!idProducto) {
    console.error('No se encontró idProducto para cargar proveedores y reseñas.');
    return;
  }

  this.router.navigate(['/app/rfq/provider-reviews'], {
    state: {
      product: this.product,
      idProducto,
      origen: 'PRODUCT_DETAIL'
    }
  });
}

  volver(): void {
    this.router.navigate(['/app/rfq/catalog']);
  }
}
