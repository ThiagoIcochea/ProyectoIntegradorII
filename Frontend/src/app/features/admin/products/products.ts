import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders
} from '@angular/common/http';
import Swal from 'sweetalert2';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';
import { MfaService } from '../../../core/services/mfa.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class AdminProductsComponent implements OnInit {

  private API_URL = `${APP_API_BASE_URL}/productos/admin`;
  private UPDATE_URL = `${APP_API_BASE_URL}/productos/admin/actualizar`;

  products: any[] = [];
  filteredProducts: any[] = [];

  estadoSeleccionado = 'Activo';

  selectedProduct: any = null;

  searchText = '';

  showManageModal = false;
  loading = true;
  detailViewOpen = false;
  private listScrollPosition = 0;

  productImages: any[] = [];

  selectedImage = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private mfaService: MfaService
  ) {}

  ngOnInit(): void {
    this.obtenerProductos();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });
  }

  async guardarCambios(): Promise<void> {

  if (!this.selectedProduct) return;

  try {
    const adminEmail = localStorage.getItem('auth_user_email') || '';
    const token = await this.mfaService.requestActionToken(adminEmail, 'ADMIN_ACTION');

    const formData = new FormData();

  formData.append(
    'idProducto',
    this.selectedProduct.idProducto.toString()
  );

  formData.append(
    'nombre',
    this.selectedProduct.name
  );

  formData.append(
    'marca',
    this.selectedProduct.brand
  );

  formData.append(
    'categoria',
    this.selectedProduct.category
  );

  formData.append(
    'estado',
    this.estadoSeleccionado.toUpperCase()
  );

  this.productImages.forEach((img, index) => {

  if (img.file) {

    formData.append(
      `imagenes[${index}].archivo`,
      img.file
    );

  } else {

    formData.append(
      `imagenes[${index}].url`,
      img.url
    );

  }

  formData.append(
    `imagenes[${index}].principal`,
    img.principal.toString()
  );

});

  this.http.post(
    this.UPDATE_URL,
    formData,
    {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'X-MFA-Authorization': token
      })
    }
  ).subscribe({

    next: async () => {

      await Swal.fire({
        icon: 'success',
        title: 'Producto actualizado',
        text: 'Los cambios del producto se guardaron correctamente.'
      });

      this.showManageModal = false;

      this.obtenerProductos();

    },

    error: async err => {

      console.error(err);

      await Swal.fire({
        icon: 'error',
        title: 'No se pudo actualizar',
        text: err?.error?.message || 'Error al actualizar'
      });

    }

  });
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'Acción cancelada',
      text: error?.message || 'MFA cancelado.'
    });
  }

}

  obtenerProductos(): void {

    this.loading = true;

    this.http.get<any[]>(this.API_URL, {
      headers: this.headers()
    }).subscribe({

      next: (res) => {

        this.products = res;
        this.filteredProducts = [...res];
        this.loading = false;

        if (this.filteredProducts.length > 0) {

          this.selectedProduct = this.filteredProducts[0];
          this.estadoSeleccionado = this.normalizeEstadoValue(
            this.selectedProduct?.status ??
            this.selectedProduct?.estado
          );
          this.cargarImagenes();

        }

        this.cdr.detectChanges();

      },

      error: (err) => {
        console.error(err);
        this.loading = false;
      }

    });

  }

  seleccionarProducto(product: any): void {

    this.selectedProduct = product;
    this.estadoSeleccionado = this.normalizeEstadoValue(
      product?.status ??
      product?.estado
    );
    this.cargarImagenes();
    this.listScrollPosition = window.scrollY;
    this.detailViewOpen = true;
    this.scrollPageTo(0);

  }

  showProductList(): void {
    this.detailViewOpen = false;
    this.scrollPageTo(this.listScrollPosition);
  }

  private scrollPageTo(top: number): void {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top, behavior: 'auto' });
    });
  }

  filtrarProductos(): void {

    const text = this.searchText.toLowerCase();

    this.filteredProducts = this.products.filter(p =>
      p?.name?.toLowerCase().includes(text) ||
      p?.brand?.toLowerCase().includes(text) ||
      p?.category?.toLowerCase().includes(text)
    );

  }

  openManageModal(): void {

    this.estadoSeleccionado = this.normalizeEstadoValue(
      this.selectedProduct?.status ??
      this.selectedProduct?.estado
    );

    this.showManageModal = true;

    this.cargarImagenes();

  }

  private normalizeEstadoValue(value: unknown): string {
    const raw = String(value ?? '').trim().toLowerCase();

    if (raw === 'inactivo' || raw === 'inactive' || raw === 'suspendido') {
      return 'Inactivo';
    }

    return 'Activo';
  }

  closeManageModal(): void {

    this.showManageModal = false;

  }

  cargarImagenes(): void {

    this.productImages = [
      ...(this.selectedProduct?.images || [])
    ];

    if (this.productImages.length > 0) {

      const principal =
        this.productImages.find(img => img.principal);

      this.selectedImage =
        principal?.url ?? this.productImages[0].url;

    } else {

      this.selectedImage = '';

    }

    this.cdr.detectChanges();

  }

  selectImage(url: string): void {

    this.selectedImage = url;

    this.cdr.detectChanges();

  }

  setPrincipal(index: number): void {

    this.productImages.forEach(img => img.principal = false);

    this.productImages[index].principal = true;

    this.syncPrincipal();

  }

  moveLeft(index: number): void {

    if (index === 0) return;

    [
      this.productImages[index],
      this.productImages[index - 1]
    ] = [
      this.productImages[index - 1],
      this.productImages[index]
    ];

    this.syncPrincipal();

  }

  moveRight(index: number): void {

    if (index >= this.productImages.length - 1) return;

    [
      this.productImages[index],
      this.productImages[index + 1]
    ] = [
      this.productImages[index + 1],
      this.productImages[index]
    ];

    this.syncPrincipal();

  }

  private syncPrincipal(): void {

    this.productImages.forEach((img, i) => {
      img.principal = i === 0;
    });

    this.productImages = [...this.productImages];

    if (this.selectedProduct) {
      this.selectedProduct.images = [...this.productImages];
    }

    if (this.productImages.length > 0) {
      this.selectedImage = this.productImages[0].url;
    } else {
      this.selectedImage = '';
    }

    this.cdr.detectChanges();

  }

onFileSelected(event: any): void {

  const file = event.target.files[0];

  if (!file) return;

  const nuevaImagen = {

    file: file,

    url: URL.createObjectURL(file),

    principal: this.productImages.length === 0

  };

  this.productImages = [

    ...this.productImages,

    nuevaImagen

  ];

  if (this.selectedProduct) {

    this.selectedProduct.images = [...this.productImages];

  }

  if (nuevaImagen.principal) {

    this.selectedImage = nuevaImagen.url;

  }

  this.cdr.detectChanges();

}

removeImage(index: number): void {

  const imagenEliminada = this.productImages[index];

  this.productImages.splice(index, 1);

  this.productImages = [...this.productImages];

  
  this.productImages.forEach((img, i) => {
    img.principal = i === 0;
  });

  if (this.selectedProduct) {
    this.selectedProduct.images = [...this.productImages];
  }

  if (this.selectedImage === imagenEliminada.url) {
    this.selectedImage =
      this.productImages.length > 0
        ? this.productImages[0].url
        : '';
  }

  this.cdr.detectChanges();
}

}
