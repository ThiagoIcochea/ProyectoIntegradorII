import { RucLookupComponent, EmpresaRuc } from '../../../shared/ruc-lookup/ruc-lookup';
// Backend touchpoint: provider registration payload, payment methods and certifications.
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL, APP_STORAGE_KEYS , APP_ROUTE_PATHS} from '../../../core/constants/app.constants';
import { Router, RouterLink } from '@angular/router';


@Component({
  selector: 'app-register-provider',
  standalone: true,
  imports: [RucLookupComponent, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './register-provider.html',
  styleUrl: './register-provider.scss'
})
export class RegisterProviderComponent implements OnInit {

  rucConfirmado = '';
  completarEmpresa(datos: EmpresaRuc | null): void {
    this.rucConfirmado = datos?.ruc || '';
    this.razonSocial = datos?.razonSocial || '';
  }

  private readonly validators = {
    name: /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    phone: /^(?:\+51\s?)?9\d{8}$/,
    password: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/,
    address: /^[A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .,#°º/-]{4,149}$/,
    ruc: /^(10|20)\d{9}$/,
    razonSocial: /^[A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .,&-]{2,119}$/,
    url: /^https?:\/\/\S+\.\S+$/,
    apiToken: /^[A-Za-z0-9._~:/+=-]{8,}$/
  };

  nombres = '';
  apellidos = '';
  correo = '';
  password = '';
  telefono = '';
  whatsapp = '';
  direccion = '';

  razonSocial = '';
  ruc = '';
  apiUrl = '';
  apiTipo = 'REST';
  apiToken = '';
  submitted = false;
  formError = '';
  aceptaLegal = false;
  showLegalModal = false;
  legalModalTitle = '';
  legalModalIntro = '';
  legalModalItems: string[] = [];
  showApiGuideModal = false;

  readonly restResponseExample = `{
  "catalogo": [
    {
      "idProducto": 100,
      "producto": "Cisco Catalyst 9200L",
      "sku": null,
      "marca": "Cisco",
      "categoria": "Switching",
      "descripcion": "Switch acceso L2",
      "precioUnitario": 2800,
      "stock": 10000,
      "garantiaMeses": 6,
      "tiempoEntregaDias": 2,
      "enOferta": true,
      "porcentajeDescuento": 5,
      "estado": "ACTIVO",
      "especificaciones": [
        {
          "nombre": "Puertos",
          "valor": "24x Gigabit"
        }
      ],
      "imagenes": [
        {
          "url": "https://www.aloinfousa.com/cdn/shop/files/26324805.jpg",
          "principal": true,
          "orden": 1
        }
      ],
      "descuentosVolumen": [
        {
          "cantidadMin": 20,
          "precioUnitario": 2520
        }
      ]
    }
  ]
}`;

  readonly graphqlQueryExample = `query ObtenerCatalogo {
  catalogo {
    idProducto
    producto
    sku
    marca
    categoria
    descripcion
    precioUnitario
    stock
    garantiaMeses
    tiempoEntregaDias
    enOferta
    porcentajeDescuento
    estado
    especificaciones {
      nombre
      valor
    }
    imagenes {
      url
      principal
      orden
    }
    descuentosVolumen {
      cantidadMin
      precioUnitario
    }
  }
}`;

  readonly graphqlResponseExample = `{
  "data": {
    "catalogo": [
      {
        "idProducto": 100,
        "producto": "Cisco Catalyst 9200L",
        "sku": null,
        "marca": "Cisco",
        "categoria": "Switching",
        "descripcion": "Switch acceso L2",
        "precioUnitario": 2800,
        "stock": 10000,
        "garantiaMeses": 6,
        "tiempoEntregaDias": 2,
        "enOferta": true,
        "porcentajeDescuento": 5,
        "estado": "ACTIVO",
        "especificaciones": [
          {
            "nombre": "Puertos",
            "valor": "24x Gigabit"
          }
        ],
        "imagenes": [
          {
            "url": "https://www.aloinfousa.com/cdn/shop/files/26324805.jpg",
            "principal": true,
            "orden": 1
          }
        ],
        "descuentosVolumen": [
          {
            "cantidadMin": 20,
            "precioUnitario": 2520
          }
        ]
      }
    ]
  }
}`;

  readonly graphqlFilterExample = `query ObtenerCatalogoPorCategoria($categoria: String!) {
  catalogo(categoria: $categoria) {
    idProducto
    producto
    marca
    categoria
    precioUnitario
    stock
    estado
  }
}`;

  readonly graphqlVariablesExample = `{
  "categoria": "Switching"
}`;

  readonly restExpectedFields = `Campos principales esperados:
- idProducto
- producto
- sku
- marca
- categoria
- descripcion
- precioUnitario
- stock
- garantiaMeses
- tiempoEntregaDias
- enOferta
- porcentajeDescuento
- estado
- especificaciones
- imagenes
- descuentosVolumen`;

  private baseUrl = `${APP_API_BASE_URL}/provider`;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  openLegalModal(type: 'terms' | 'privacy'): void {
    if (type === 'terms') {
      this.legalModalTitle = 'Terminos y Condiciones para Proveedores';
      this.legalModalIntro = 'Estos terminos regulan la participacion de proveedores en Nethink para recibir RFQs, publicar informacion comercial y cotizar productos B2B.';
      this.legalModalItems = [
        'El proveedor declara que la informacion de empresa, RUC, contacto, catalogo, API, certificaciones y metodos de pago es veraz y esta actualizada.',
        'Las cotizaciones enviadas deben respetar precio, stock, condiciones de entrega, vigencia y disponibilidad informadas al cliente.',
        'La integracion API debe usarse para sincronizar informacion operativa legitima, sin exponer credenciales, datos sensibles innecesarios o servicios no autorizados.',
        'Nethink puede registrar actividad, pruebas de conexion, cambios de configuracion y eventos comerciales para trazabilidad, seguridad y soporte.',
        'El proveedor es responsable de cumplir las condiciones acordadas con clientes y de mantener sus certificaciones vigentes cuando las use como respaldo comercial.'
      ];
    } else {
      this.legalModalTitle = 'Politica de Privacidad para Proveedores';
      this.legalModalIntro = 'Esta politica explica como Nethink trata los datos del proveedor durante el registro, validacion, integracion API y participacion en oportunidades RFQ.';
      this.legalModalItems = [
        'Recolectamos datos de usuario, empresa, RUC, contacto, datos fiscales consultados, configuracion API, metodos de pago y certificaciones seleccionadas.',
        'La informacion comercial necesaria puede mostrarse a clientes para evaluar cotizaciones, proveedores disponibles, cumplimiento y condiciones de compra.',
        'Los tokens o datos de API se usan para operar integraciones y pruebas de conexion; deben mantenerse protegidos y actualizarse si existe riesgo de exposicion.',
        'No vendemos datos personales. La informacion se usa para autenticacion, seguridad, trazabilidad, soporte, sincronizacion y mejora del marketplace B2B.',
        'El proveedor puede solicitar revision o correccion de sus datos mediante los canales internos definidos por Nethink.'
      ];
    }

    this.showLegalModal = true;
  }

  closeLegalModal(): void {
    this.showLegalModal = false;
  }

  openApiGuideModal(): void {
    this.showApiGuideModal = true;
  }

  closeApiGuideModal(): void {
    this.showApiGuideModal = false;
  }

  get isRestGuide(): boolean {
    return this.apiTipo === 'REST';
  }

  get isGraphqlGuide(): boolean {
    return this.apiTipo === 'GRAPHQL';
  }

  get apiGuideTitle(): string {
    if (this.isGraphqlGuide) {
      return 'Guia de integracion GraphQL';
    }

    if (this.isRestGuide) {
      return 'Guia de integracion REST';
    }

    return 'Guia de integracion API';
  }

  get apiGuideDescription(): string {
    if (this.isGraphqlGuide) {
      return 'Usa un endpoint GraphQL para consultar el catalogo de productos. El sistema puede solicitar unicamente los campos necesarios para construir el catalogo RFQ.';
    }

    if (this.isRestGuide) {
      return 'Usa un endpoint REST que devuelva el catalogo de productos en formato JSON. El sistema espera productos con informacion comercial, stock, imagenes, especificaciones y descuentos por volumen.';
    }

    return 'Selecciona REST o GRAPHQL como tipo de API para ver una guia tecnica de integracion del catalogo.';
  }

  headers() {
    const token = localStorage.getItem(APP_STORAGE_KEYS.token);

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  /* ================= METODOS DE PAGO ================= */

  metodosPago: any[] = [];
  showPagoModal = false;
  pagoSubmitted = false;
  pagoError = '';

  tipoPago = '';
  entidadPago = '';
  numeroCuenta = '';

  openPagoModal() {
    this.pagoSubmitted = false;
    this.pagoError = '';
    this.showPagoModal = true;
  }

  closePagoModal() {
    this.pagoSubmitted = false;
    this.pagoError = '';
    this.showPagoModal = false;
  }

  addMetodoPago() {
    this.pagoSubmitted = true;
    this.pagoError = '';

    if (!this.tipoPago || !this.entidadPago || !this.numeroCuenta) {
      this.pagoError = 'Completa todos los campos del metodo de pago.';
      return;
    }

    const account = this.onlyDigits(this.numeroCuenta);
    const validAccount = ['YAPE', 'PLIN'].includes(this.tipoPago)
      ? /^9\d{8}$/.test(account)
      : /^\d{6,30}$/.test(account);

    if (!validAccount) {
      this.pagoError = ['YAPE', 'PLIN'].includes(this.tipoPago)
        ? 'Yape/Plin debe usar un celular peruano de 9 digitos que inicia con 9.'
        : 'La cuenta bancaria debe tener entre 6 y 30 digitos.';
      alert(this.pagoError);
      return;
    }

    this.metodosPago.push({
      tipo: this.tipoPago,
      entidad: this.entidadPago,
      numeroCuenta: account
    });

    this.tipoPago = '';
    this.entidadPago = '';
    this.numeroCuenta = '';
    this.showPagoModal = false;
  }

  removeMetodoPago(index: number): void {
    this.metodosPago.splice(index, 1);
  }

  maskCuenta(numeroCuenta: string): string {
    if (!numeroCuenta) {
      return 'Sin numero';
    }

    const visibleDigits = numeroCuenta.slice(-4);
    return `**** **** ${visibleDigits}`;
  }

  isMissing(value: string | null | undefined): boolean {
    return this.submitted && !String(value || '').trim();
  }

  isPaymentFieldMissing(value: string | null | undefined): boolean {
    return this.pagoSubmitted && !String(value || '').trim();
  }

  /* ================= CERTIFICACIONES ================= */

  certificaciones: any[] = [];
  selectedCerts: any = {};
  certificacionesLoading = true;
  certificacionesError = '';

  fechaObtencionMap: any = {};
  fechaExpiracionMap: any = {};

  ngOnInit(): void {
    this.cargarCertificaciones();
  }

  cargarCertificaciones(): void {
    this.certificacionesLoading = true;
    this.certificacionesError = '';

    this.http.get<any>(`${APP_API_BASE_URL}/certificaciones`)
      .subscribe({
        next: res => {
          this.certificaciones = Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
              ? res.data
              : [];

          this.certificacionesLoading = false;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error(err);
          this.certificaciones = [];
          this.certificacionesLoading = false;
          this.certificacionesError = err?.status === 403
            ? 'El backend no esta permitiendo cargar certificaciones en el registro publico.'
            : 'No se pudieron cargar las certificaciones desde el backend.';
          this.cdr.detectChanges();
        }
      });
  }

  toggleCertificacion(event: any, id: number) {

    if (event.target.checked) {
      this.selectedCerts[id] = true;
    } else {
      delete this.selectedCerts[id];
      delete this.fechaObtencionMap[id];
      delete this.fechaExpiracionMap[id];
    }
  }

  isCertDateMissing(id: number, field: 'obtencion' | 'expiracion'): boolean {
    if (!this.submitted || !this.selectedCerts[id]) {
      return false;
    }

    const map = field === 'obtencion'
      ? this.fechaObtencionMap
      : this.fechaExpiracionMap;

    return !map[id];
  }

  private hasRequiredFields(): boolean {
    return Boolean(
      this.nombres.trim() &&
      this.apellidos.trim() &&
      this.correo.trim() &&
      this.password.trim() &&
      this.telefono.trim() &&
      this.whatsapp.trim() &&
      this.direccion.trim() &&
      this.ruc.trim() &&
      this.apiUrl.trim() &&
      this.apiTipo.trim()
    );
  }

  hasSelectedCertification(): boolean {
    return Object.keys(this.selectedCerts).length > 0;
  }

  private hasCertificationDates(): boolean {
    return Object.keys(this.selectedCerts).every(id =>
      Boolean(this.fechaObtencionMap[id] && this.fechaExpiracionMap[id])
    );
  }

  register() {
    this.submitted = true;
    this.formError = '';

    if (this.rucConfirmado !== this.ruc || !this.rucConfirmado) {
      this.formError = 'Espera a que se consulte correctamente el RUC.';
      return;
    }

    if (!this.hasRequiredFields()) {
      this.formError = 'Completa todos los campos obligatorios antes de registrar el proveedor.';
      return;
    }

    const validationError = this.validateProviderForm();
    if (validationError) {
      this.formError = validationError;
      alert(validationError);
      return;
    }

    if (this.metodosPago.length < 1) {
      this.formError = 'Debes agregar al menos 1 metodo de pago.';
      return;
    }

    if (this.certificacionesLoading) {
      this.formError = 'Espera a que terminen de cargar las certificaciones.';
      return;
    }

    if (this.certificacionesError) {
      this.formError = this.certificacionesError;
      return;
    }

    if (this.certificaciones.length < 1) {
      this.formError = 'No hay certificaciones disponibles desde el backend.';
      return;
    }

    if (!this.hasSelectedCertification()) {
      this.formError = 'Debes seleccionar al menos 1 certificacion.';
      return;
    }

    if (!this.hasCertificationDates()) {
      this.formError = 'Completa las fechas de cada certificacion seleccionada.';
      return;
    }

    if (!this.aceptaLegal) {
      this.formError = 'Debes aceptar los terminos, condiciones y politica de privacidad.';
      return;
    }

    const certificacionesPayload = Object.keys(this.selectedCerts).map(id => ({
      idCertificacion: Number(id),
      fechaObtencion: this.fechaObtencionMap[id],
      fechaExpiracion: this.fechaExpiracionMap[id]
    }));

    const payload = {
      nombres: this.nombres,
      apellidos: this.apellidos,
      correo: this.correo,
      password: this.password,
      telefono: this.telefono,
      whatsapp: this.whatsapp,
      direccion: this.direccion,

      razonSocial: this.razonSocial,
      ruc: this.ruc,

      apiUrl: this.apiUrl,
      apiTipo: this.apiTipo,
      apiToken: this.apiToken,

      metodosPago: this.metodosPago,
      certificaciones: certificacionesPayload
    };

    this.http.post(
      `${APP_API_BASE_URL}/auth/register-provider/start`,
      payload,
      {}
    ).subscribe({
      next: (res: any) => {
         sessionStorage.setItem('pending_mfa_flow', JSON.stringify(res));
         this.router.navigate(['/mfa'], { replaceUrl: true });
      },
      error: err => {
        console.error(err);
        this.formError = err?.error?.message || 'No se pudo registrar el proveedor.';
      }
    });
  }

  private validateProviderForm(): string {
    const telefono = this.onlyDigits(this.telefono);
    const whatsapp = this.onlyDigits(this.whatsapp);

    if (!this.validators.name.test(this.nombres)) {
      return 'Nombres invalido: debe iniciar con mayuscula y usar solo letras. Ejemplo: Juan Carlos.';
    }

    if (this.apellidos && this.apellidos.trim() && !this.validators.name.test(this.apellidos)) {
      return 'Apellidos invalido: debe iniciar con mayuscula y usar solo letras. Ejemplo: Perez Ramos.';
    }

    if (!this.validators.email.test(this.correo)) {
      return 'Correo invalido: usa un formato como usuario@empresa.com.';
    }

    if (!this.validators.password.test(this.password)) {
      return 'Contrasena invalida: minimo 8 caracteres, una mayuscula, una minuscula y un numero.';
    }

    if (!this.validators.phone.test(telefono)) {
      return 'Telefono invalido: debe ser celular peruano de 9 digitos e iniciar con 9. Ejemplo: 987654321.';
    }

    if (!this.validators.phone.test(whatsapp)) {
      return 'WhatsApp invalido: debe ser celular peruano de 9 digitos e iniciar con 9. Ejemplo: 987654321.';
    }

    if (!this.validators.address.test(this.direccion)) {
      return 'Direccion invalida: debe iniciar con mayuscula o numero y tener al menos 5 caracteres.';
    }



    if (!this.validators.ruc.test(this.ruc)) {
      return 'RUC invalido: debe tener 11 digitos y empezar con 10 o 20.';
    }

    if (!this.validators.url.test(this.apiUrl)) {
      return 'Endpoint API invalido: debe iniciar con http:// o https:// y tener dominio/ruta valida.';
    }

    if (!['REST', 'GRAPHQL', 'WEBHOOK'].includes(this.apiTipo)) {
      return 'Tipo de API invalido: elige REST, GRAPHQL o WEBHOOK.';
    }

    if (this.apiToken.trim() && !this.validators.apiToken.test(this.apiToken)) {
      return 'API Token invalido: minimo 8 caracteres, solo letras, numeros y simbolos seguros como . _ - / : + =.';
    }

    const invalidPayment = this.metodosPago.find(mp => !this.validatePaymentMethod(mp));
    if (invalidPayment) {
      return 'Metodo de pago invalido: la cuenta debe tener entre 6 y 30 digitos, o 9 digitos para Yape/Plin.';
    }

    this.telefono = telefono;
    this.whatsapp = whatsapp;
    return '';
  }

  private validatePaymentMethod(mp: any): boolean {
    const account = this.onlyDigits(mp?.numeroCuenta);
    if (['YAPE', 'PLIN'].includes(String(mp?.tipo || '').toUpperCase())) {
      return /^9\d{8}$/.test(account);
    }

    return /^\d{6,30}$/.test(account);
  }

  private onlyDigits(value: string): string {
    return String(value || '').replace(/\D/g, '');
  }
}
