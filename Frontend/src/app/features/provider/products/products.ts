import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';
import { MfaService } from '../../../core/services/mfa.service';
import { extractValidationMessage } from '../../../core/utils/form-validation';

@Component({
  selector: 'app-provider-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class ProviderProductsComponent implements OnInit {

  products: any[] = [];
  filteredProducts: any[] = [];
  loading = true;
  readonly skeletonRows = Array.from({ length: 5 });

  search = '';
  activos = 0;
  stockDisponibleCount = 0;
  bajoStockCount = 0;

  showCreateModal = false;
  showManageModal = false;
  saving = false;
  createError = '';
  newProduct = this.emptyProduct();
  manageProduct = this.emptyProduct();
  manageProductId: number | null = null;

  categorias: Array<{ idCategoria: number; nombre: string }> = [];
  marcas: Array<{ idMarca: number; nombre: string }> = [];

  private API_URL = `${APP_API_BASE_URL}/proveedor-productos`;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private mfaService: MfaService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCatalogoBase();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });
  }

  cargarProductos(): void {
    this.loading = true;

    this.http.get<any[]>(`${this.API_URL}/mis-productos`, { headers: this.headers() }).subscribe({
      next: (data) => {
        this.products = data || [];
        this.filteredProducts = [...this.products];
        this.calcularResumenFiltrado();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.products = [];
        this.filteredProducts = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filtrarProductos(): void {
    const texto = this.search.toLowerCase();
    this.filteredProducts = this.products.filter((p: any) => {
      const haystack = [
        p.skuGlobal,
        p.nombre,
        p.categoria,
        p.marca,
        p.descripcion
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(texto);
    });

    this.calcularResumenFiltrado();
  }

  calcularResumenFiltrado(): void {
    this.activos = 0;
    this.stockDisponibleCount = 0;
    this.bajoStockCount = 0;

    for (const p of this.filteredProducts) {
      if (p.estado === 'ACTIVO') {
        this.activos++;
      }

      if (Number(p.stockDisponible ?? p.stock ?? 0) > 0) {
        this.stockDisponibleCount++;
      }

      if (Number(p.stock ?? 0) < 10) {
        this.bajoStockCount++;
      }
    }
  }

  abrirNuevoProducto(): void {
    this.newProduct = this.emptyProduct();
    this.createError = '';
    this.showCreateModal = true;
    this.showManageModal = false;
  }

  abrirGestionProducto(product: any): void {
    this.manageProductId = product?.idProvProd ?? null;
    this.manageProduct = this.toFormProduct(product);
    this.createError = '';
    this.showManageModal = true;
    this.showCreateModal = false;
  }

  cerrarNuevoProducto(): void {
    if (!this.saving) {
      this.showCreateModal = false;
    }
  }

  cerrarGestionProducto(): void {
    if (!this.saving) {
      this.showManageModal = false;
    }
  }

  private cargarCatalogoBase(): void {
    this.http.get<any[]>(`${APP_API_BASE_URL}/catalogo/categorias`, { headers: this.headers() }).subscribe({
      next: (data) => {
        this.categorias = data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.categorias = [];
      }
    });

    this.http.get<any[]>(`${APP_API_BASE_URL}/catalogo/marcas`, { headers: this.headers() }).subscribe({
      next: (data) => {
        this.marcas = data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.marcas = [];
      }
    });
  }

  async crearProducto(): Promise<void> {
    this.createError = '';
    const validationError = this.validarProducto(this.newProduct);
    if (validationError) {
      this.createError = validationError;
      await Swal.fire({ icon: 'warning', title: 'Datos incompletos', text: validationError });
      return;
    }

    this.saving = true;
    try {
      const token = await this.requestMfaToken();
      const payload = this.buildCatalogPayload(this.newProduct, true);

      const response = await this.sendCatalogPayload(payload, token);
      this.showCreateModal = false;
      this.saving = false;
      await Swal.fire({ icon: 'success', title: 'Producto creado', text: 'El producto se publicó correctamente.' });
      this.cargarProductos();
      return response;
    } catch (error: any) {
      this.saving = false;
      const mensaje = extractValidationMessage(error, 'No se pudo crear el producto.');
      this.createError = mensaje;
      await Swal.fire({ icon: 'error', title: 'No se pudo crear el producto', text: mensaje });
    }
  }

  async guardarProductoGestionado(): Promise<void> {
    if (!this.manageProductId) {
      return;
    }

    this.createError = '';
    const validationError = this.validarProducto(this.manageProduct);
    if (validationError) {
      this.createError = validationError;
      await Swal.fire({ icon: 'warning', title: 'Datos incompletos', text: validationError });
      return;
    }

    this.saving = true;
    try {
      const token = await this.requestMfaToken();
      const payload = this.buildCatalogPayload(this.manageProduct, false);
      await this.sendCatalogPayload(payload, token, this.manageProductId);
      this.showManageModal = false;
      this.saving = false;
      await Swal.fire({ icon: 'success', title: 'Producto actualizado', text: 'Se actualizó el stock, descuentos y descripción del producto.' });
      this.cargarProductos();
    } catch (error: any) {
      this.saving = false;
      const mensaje = extractValidationMessage(error, 'No se pudo actualizar el producto.');
      this.createError = mensaje;
      await Swal.fire({ icon: 'error', title: 'No se pudo actualizar el producto', text: mensaje });
    }
  }

  private async requestMfaToken(): Promise<string> {
    const email = localStorage.getItem('auth_user_email') || '';
    if (!email) {
      throw new Error('No se encontró el correo del usuario para MFA.');
    }

    return this.mfaService.requestActionToken(email, 'PROVIDER_API_UPDATE');
  }

  private buildCatalogPayload(product: any, includeCurrentCatalog: boolean): any {
    const entry = {
      sku: product.sku && String(product.sku).trim() ? product.sku.trim() : null,
      marca: product.marca,
      stock: Number(product.stock ?? 0),
      estado: (product.estado || 'ACTIVO').toUpperCase(),
      enOferta: Boolean(product.enOferta),
      imagenes: Array.isArray(product.imagenes) ? product.imagenes.map((img: any) => ({
        url: img.url || '',
        orden: Number(img.orden ?? 1),
        principal: Boolean(img.principal)
      })) : [],
      producto: product.producto,
      categoria: product.categoria,
      idProducto: product.idProducto ?? null,
      descripcion: product.descripcion || null,
      garantiaMeses: Number(product.garantiaMeses || 0),
      precioUnitario: Number(product.precioUnitario ?? 0),
      especificaciones: Array.isArray(product.especificaciones) ? product.especificaciones.map((spec: any) => ({
        nombre: spec.nombre || '',
        valor: spec.valor || ''
      })) : [],
      descuentosVolumen: (product.descuentosVolumen || [])
        .filter((item: any) => item && Number.isFinite(Number(item.cantidadMin)) && Number(item.cantidadMin) > 0 && Number.isFinite(Number(item.precioUnitario)) && Number(item.precioUnitario) >= 0)
        .map((item: any) => ({
          cantidadMin: Number(item.cantidadMin),
          precioUnitario: Number(item.precioUnitario)
        })),
      tiempoEntregaDias: Number(product.tiempoEntregaDias || 0),
      porcentajeDescuento: Number(product.porcentajeDescuento || 0)
    };

    if (!includeCurrentCatalog) {
      return { catalogo: [entry] };
    }

    const catalogo = (this.products || []).map((p: any) => this.toCatalogEntry(p));
    catalogo.push(entry);
    return { catalogo };
  }

  private async sendCatalogPayload(payload: any, token: string, idProvProd?: number): Promise<any> {
    // PATCH actualiza primero; PUT y POST quedan como compatibilidad para APIs
    // de proveedores que no expongan ese verbo.
    const preferredMethods: Array<'PATCH' | 'PUT' | 'POST'> = ['PATCH', 'PUT', 'POST'];

    let lastError: any;

    for (const method of preferredMethods) {
      try {
        const url = idProvProd
          ? `${this.API_URL}/mis-productos/${idProvProd}`
          : `${this.API_URL}/mis-productos`;

        const response = await this.http.request<any>(method, url, {
          headers: new HttpHeaders({
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'X-MFA-Authorization': token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(payload)
        }).toPromise();

        return response;
      } catch (error: any) {
        lastError = error;

        // Solo se prueba el siguiente verbo cuando el servidor no lo soporta.
        // Reintentar ante validaciones o conflictos podría duplicar o alterar el catálogo.
        if (![404, 405, 501].includes(Number(error?.status))) {
          throw error;
        }
      }
    }

    throw lastError || new Error('No se pudo sincronizar el catálogo del proveedor.');
  }

  private toCatalogEntry(product: any): any {
    return {
      sku: product.skuGlobal ?? product.sku ?? null,
      marca: product.marca || product.brand || '',
      stock: Number(product.stock ?? 0),
      estado: (product.estado || product.estadoProducto || 'ACTIVO').toUpperCase(),
      enOferta: Boolean(product.enOferta),
      imagenes: Array.isArray(product.imagenes) ? product.imagenes.map((img: any) => ({
        url: img.url || '',
        orden: Number(img.orden ?? 1),
        principal: Boolean(img.principal)
      })) : [],
      producto: product.nombre || product.producto || product.name || '',
      categoria: product.categoria || product.category || '',
      idProducto: product.idProducto ?? null,
      descripcion: product.descripcion || '',
      garantiaMeses: Number(product.garantiaMeses || 0),
      precioUnitario: Number(product.precio ?? product.precioUnitario ?? 0),
      especificaciones: Array.isArray(product.especificaciones) ? product.especificaciones.map((spec: any) => ({
        nombre: spec.nombre || '',
        valor: spec.valor || ''
      })) : [],
      descuentosVolumen: Array.isArray(product.descuentosVolumen) ? product.descuentosVolumen
        .filter((item: any) => item && Number.isFinite(Number(item.cantidadMin)) && Number(item.cantidadMin) > 0 && Number.isFinite(Number(item.precioUnitario)) && Number(item.precioUnitario) >= 0)
        .map((item: any) => ({
          cantidadMin: Number(item.cantidadMin),
          precioUnitario: Number(item.precioUnitario)
        })) : [],
      tiempoEntregaDias: Number(product.tiempoEntregaDias || 0),
      porcentajeDescuento: Number(product.porcentajeDescuento || 0)
    };
  }

  private toFormProduct(product: any): any {
    return {
      idProducto: product?.idProducto ?? null,
      idProvProd: product?.idProvProd ?? null,
      producto: product?.nombre || product?.producto || product?.name || '',
      sku: product?.skuGlobal || product?.sku || '',
      marca: product?.marca || product?.brand || '',
      categoria: product?.categoria || product?.category || '',
      descripcion: product?.descripcion || '',
      precioUnitario: product?.precio ?? product?.precioUnitario ?? null,
      stock: product?.stock ?? null,
      garantiaMeses: product?.garantiaMeses ?? 0,
      tiempoEntregaDias: product?.tiempoEntregaDias ?? 0,
      enOferta: Boolean(product?.enOferta),
      porcentajeDescuento: product?.porcentajeDescuento ?? 0,
      estado: product?.estado || product?.estadoProducto || 'ACTIVO',
      imagenes: Array.isArray(product?.imagenes) ? product.imagenes : [],
      especificaciones: Array.isArray(product?.especificaciones) ? product.especificaciones : [],
      descuentosVolumen: Array.isArray(product?.descuentosVolumen)
        ? product.descuentosVolumen.map((item: any) => ({
          cantidadMin: Number(item?.cantidadMin ?? 0),
          precioUnitario: Number(item?.precioUnitario ?? 0)
        }))
        : []
    };
  }

  private validarProducto(producto: any): string | null {
    const nombre = String(producto?.producto || '').trim();
    const marca = String(producto?.marca || '').trim();
    const categoria = String(producto?.categoria || '').trim();
    const precio = Number(producto?.precioUnitario);
    const stock = Number(producto?.stock);
    const descuento = Number(producto?.porcentajeDescuento || 0);

    if (!nombre) return 'Debe indicar el nombre del producto.';
    if (!marca) return 'Debe seleccionar una marca válida.';
    if (!categoria) return 'Debe seleccionar una categoría válida.';
    if (!Number.isFinite(precio) || precio < 0) return 'El precio unitario debe ser un número mayor o igual a cero.';
    if (!Number.isFinite(stock) || stock < 0) return 'El stock debe ser un número mayor o igual a cero.';
    if (!Number.isFinite(descuento) || descuento < 0 || descuento > 100) return 'El descuento debe estar entre 0 y 100.';

    for (const d of producto?.descuentosVolumen || []) {
      if (!Number.isFinite(Number(d?.cantidadMin)) || Number(d.cantidadMin) <= 0) {
        return 'Cada descuento por volumen debe tener una cantidad mínima válida.';
      }
      if (!Number.isFinite(Number(d?.precioUnitario)) || Number(d.precioUnitario) < 0) {
        return 'Cada descuento por volumen debe tener un precio unitario válido.';
      }
    }

    return null;
  }

  agregarDescuento(target: any): void {
    if (!Array.isArray(target.descuentosVolumen)) {
      target.descuentosVolumen = [];
    }
    target.descuentosVolumen.push({ cantidadMin: null, precioUnitario: null });
  }

  agregarEspecificacion(target: any): void {
    if (!Array.isArray(target.especificaciones)) {
      target.especificaciones = [];
    }
    target.especificaciones.push({ nombre: '', valor: '' });
  }

  eliminarDescuento(target: any, index: number): void {
    if (!Array.isArray(target.descuentosVolumen)) {
      return;
    }
    target.descuentosVolumen.splice(index, 1);
  }

  eliminarEspecificacion(target: any, index: number): void {
    if (!Array.isArray(target.especificaciones)) {
      return;
    }
    target.especificaciones.splice(index, 1);
  }

  private emptyProduct(): any {
    return {
      producto: '',
      sku: '',
      marca: '',
      categoria: '',
      descripcion: '',
      precioUnitario: null as number | null,
      stock: null as number | null,
      garantiaMeses: 0,
      tiempoEntregaDias: 0,
      enOferta: false,
      porcentajeDescuento: 0,
      estado: 'ACTIVO',
      imagenes: [] as Array<any>,
      especificaciones: [] as Array<any>,
      descuentosVolumen: [] as Array<{ cantidadMin: number | null; precioUnitario: number | null; }>
    };
  }
}
