import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../core/constants/app.constants';
import { MfaService } from '../../core/services/mfa.service';
import { ThemeService } from '../../core/services/theme.service';
import { buildProductNotFoundAction } from './voice-assistant.utils';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

@Component({
  selector: 'app-voice-assistant',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voice-assistant.html',
  styleUrl: './voice-assistant.scss'
})
export class VoiceAssistantComponent implements OnDestroy {

  listening = false;
  thinking = false;
  transcript = '';
  answer = '';
  statusRendered = false;
  statusVisible = false;
  fabRight: number | null = 22;
  fabBottom: number | null = 22;
  fabLeft: number | null = null;
  fabTop: number | null = null;
  private dragging = false;
  private suppressFabClick = false;
  private fabPointerId: number | null = null;
  private fabElement: HTMLElement | null = null;
  private fabDragStartX = 0;
  private fabDragStartY = 0;
  private fabStartLeft = 0;
  private fabStartTop = 0;
  private fabPointerX = 0;
  private fabPointerY = 0;
  private fabDragFrame: number | null = null;
  private pending:
    | { type: 'TRACKING_ID' }
    | { type: 'ADD_PRODUCT'; qty: number }
    | { type: 'PROFILE_FIELD' }
    | { type: 'PROFILE_VALUE'; field: string }
    | { type: 'PROFILE_MFA_CODE'; email: string; tempToken: string; method: string; formData: FormData; field: string; value: string }
    | { type: 'ORDER_RUC' }
    | { type: 'ORDER_ADDRESS'; ruc: string }
    | null = null;

  private voiceStatusTimer: ReturnType<typeof window.setTimeout> | null = null;
  private voiceStatusRemovalTimer: ReturnType<typeof window.setTimeout> | null = null;
  private readonly voiceStatusDurationMs = 5500;
  private readonly voiceStatusFadeMs = 300;

  constructor(
    private http: HttpClient,
    private router: Router,
    private mfaService: MfaService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.clearVoiceStatusTimer();
    this.clearVoiceStatusRemovalTimer();
    if (this.fabDragFrame) {
      window.cancelAnimationFrame(this.fabDragFrame);
      this.fabDragFrame = null;
    }
    window.removeEventListener('pointermove', this.onFabPointerMove);
    window.removeEventListener('pointerup', this.onFabPointerUp);
    window.removeEventListener('pointercancel', this.onFabPointerUp);
    window.speechSynthesis?.cancel();
  }

  onFabPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }

    this.dragging = false;
    this.suppressFabClick = false;
    this.fabPointerId = event.pointerId;
    this.fabElement = event.currentTarget as HTMLElement;
    this.fabDragStartX = event.clientX;
    this.fabDragStartY = event.clientY;
    this.fabStartLeft = this.fabLeft ?? (window.innerWidth - 22 - 58);
    this.fabStartTop = this.fabTop ?? (window.innerHeight - 22 - 58);
    this.fabPointerX = event.clientX;
    this.fabPointerY = event.clientY;
    this.fabElement.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', this.onFabPointerMove);
    window.addEventListener('pointerup', this.onFabPointerUp);
    window.addEventListener('pointercancel', this.onFabPointerUp);
  }

  private onFabPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.fabPointerId) {
      return;
    }

    this.fabPointerX = event.clientX;
    this.fabPointerY = event.clientY;

    const dx = this.fabPointerX - this.fabDragStartX;
    const dy = this.fabPointerY - this.fabDragStartY;

    if (!this.dragging) {
      // Preserve a normal tap/click; only turn it into a drag after a deliberate movement.
      if (Math.hypot(dx, dy) < 7) {
        return;
      }

      this.dragging = true;
      this.suppressFabClick = true;
      this.fabLeft = this.fabStartLeft;
      this.fabTop = this.fabStartTop;
      this.fabRight = null;
      this.fabBottom = null;
    }

    if (this.fabDragFrame) {
      return;
    }

    this.fabDragFrame = window.requestAnimationFrame(() => {
      const currentDx = this.fabPointerX - this.fabDragStartX;
      const currentDy = this.fabPointerY - this.fabDragStartY;

      this.fabLeft = Math.min(Math.max(8, this.fabStartLeft + currentDx), window.innerWidth - 66);
      this.fabTop = Math.min(Math.max(8, this.fabStartTop + currentDy), window.innerHeight - 66);
      this.fabDragFrame = null;
    });
  };

  private onFabPointerUp = (event?: PointerEvent): void => {
    if (event && event.pointerId !== this.fabPointerId) {
      return;
    }

    this.dragging = false;
    if (this.fabDragFrame) {
      window.cancelAnimationFrame(this.fabDragFrame);
      this.fabDragFrame = null;
    }
    window.removeEventListener('pointermove', this.onFabPointerMove);
    window.removeEventListener('pointerup', this.onFabPointerUp);
    window.removeEventListener('pointercancel', this.onFabPointerUp);
    if (this.fabPointerId !== null && this.fabElement?.hasPointerCapture(this.fabPointerId)) {
      this.fabElement.releasePointerCapture(this.fabPointerId);
    }
    this.fabPointerId = null;
    this.fabElement = null;
  };

  onFabClick(event: MouseEvent): void {
    if (this.suppressFabClick) {
      event.preventDefault();
      event.stopPropagation();
      this.suppressFabClick = false;
      return;
    }

    this.toggle();
  }

  toggle(): void {
    if (this.listening || this.thinking) {
      return;
    }

    this.clearVoiceStatus();

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      this.say('Tu navegador no tiene reconocimiento de voz disponible. Puedes usar Chrome o Edge.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'es-PE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.listening = true;
      this.showVoiceStatus();
    };
    recognition.onerror = () => {
      this.listening = false;
      this.showVoiceStatus();
      this.say('No pude escuchar bien. Intenta otra vez.');
    };
    recognition.onend = () => {
      this.listening = false;
      this.showVoiceStatus();
    };
    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript || '';
      this.transcript = text;
      this.cdr.markForCheck();
      this.handleVoice(text);
    };

    recognition.start();
  }

  private async handleVoice(text: string): Promise<void> {
    const handled = await this.handleLocalIntent(text);

    if (!handled) {
      this.askGroq(text);
    }
  }

  private askGroq(text: string): void {
    if (!text.trim()) {
      return;
    }

    this.thinking = true;
    this.showVoiceStatus();

    this.http.post<any>(`${APP_API_BASE_URL}/assistant/voice`, {
      text,
      currentPath: this.router.url
    }, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
      })
    }).subscribe({
      next: res => {
        this.thinking = false;
        this.answer = res?.answer || 'Listo.';
        this.showVoiceStatus();
        this.handleAction(res);
        this.speak(this.answer);
      },
      error: () => {
        this.thinking = false;
        this.showVoiceStatus();
        this.say('No pude procesar la solicitud por voz en este momento.');
      }
    });
  }

  private handleAction(res: any): void {
    const role = this.normalizeRole(localStorage.getItem(APP_STORAGE_KEYS.role));

    if (res?.requiresMfa) {
      this.answer = `${res.answer || ''} Por seguridad, esa accion requiere multifactor.`;
      this.showVoiceStatus();
    }

    if (res?.action === 'NAVIGATE' && res?.route) {
      const route = this.allowedRouteForRole(role, res.route);
      if (route) {
        this.router.navigate([route]);
      } else {
        this.say('No tienes permiso para abrir esa seccion con tu rol actual.');
      }
      return;
    }

    if (res?.action === 'SEARCH' && res?.search) {
      const route = this.allowedSearchRouteForRole(role);
      if (route) {
        this.router.navigate([route], { queryParams: { search: res.search } });
      } else {
        this.say('No tengo un panel permitido para esa busqueda con tu rol actual.');
      }
    }
  }

  private speak(text: string): void {
    if (!('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-PE';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  private async handleLocalIntent(text: string): Promise<boolean> {
    const normalized = this.normalize(text);
    const role = (localStorage.getItem(APP_STORAGE_KEYS.role) || '').toUpperCase();

    if (this.pending) {
      return this.continuePending(text, normalized);
    }

    if (this.includesAny(normalized, ['cerrar sesion', 'salir de mi cuenta', 'logout', 'desconectarme'])) {
      this.logout();
      return true;
    }

    if (this.includesAny(normalized, ['tracking', 'seguimiento', 'rastrear', 'seguir pedido', 'ver pedido'])) {
      if (role !== 'CLIENTE') {
        this.say('El tracking de pedidos esta disponible para clientes. Te llevo a tu panel correspondiente.');
        this.router.navigate([role === 'PROVEEDOR' ? '/app/provider/requests' : '/app/admin/dashboard']);
        return true;
      }

      const id = this.extractRequestId(normalized);
      if (!id) {
        this.pending = { type: 'TRACKING_ID' };
        this.say('Claro. Dime el numero de solicitud o el codigo RFQ que quieres rastrear.');
        return true;
      }

      this.openTracking(id);
      return true;
    }

    if (this.includesAny(normalized, ['agrega', 'agregar', 'anade', 'añade', 'pon en carrito', 'al carrito'])) {
      if (role !== 'CLIENTE') {
        this.say('Solo el cliente puede agregar productos al carrito RFQ. Puedo ayudarte a revisar tus solicitudes o productos segun tu rol.');
        return true;
      }

      const qty = this.extractQuantity(normalized) || 1;
      const productQuery = this.cleanProductQuery(normalized);

      if (!productQuery) {
        this.pending = { type: 'ADD_PRODUCT', qty };
        this.say('Listo. Dime el nombre del producto que quieres agregar al carrito.');
        return true;
      }

      await this.addProductToCart(productQuery, qty);
      return true;
    }

    if (this.includesAny(normalized, ['buscar proveedor', 'buscame un proveedor', 'busca un proveedor', 'ranking de proveedores', 'top proveedores', 'mejores proveedores'])) {
      if (role !== 'CLIENTE') {
        this.say('El ranking de proveedores esta disponible para clientes. Te llevo a tu panel permitido.');
        this.router.navigate([role === 'PROVEEDOR' ? '/app/provider/dashboard' : '/app/admin/providers']);
        return true;
      }

      if (this.readCart().length) {
        await this.createRfqFromCart();
        return true;
      }

      this.openProviderRanking();
      return true;
    }

    if (this.includesAny(normalized, ['crear solicitud', 'generar solicitud', 'buscar proveedores', 'crear rfq', 'cotizar carrito', 'hacer solicitud', 'nueva solicitud'])) {
      if (role !== 'CLIENTE') {
        this.say('Las solicitudes RFQ las crea el cliente. Con tu rol puedo navegar a tus operaciones permitidas.');
        return true;
      }

      if (this.readSelectedProvider()) {
        await this.startOrderConfirmation(normalized);
        return true;
      }

      await this.createRfqFromCart();
      return true;
    }

    if (this.includesAny(normalized, ['mejor proveedor', 'selecciona proveedor', 'seleccionar proveedor', 'elige proveedor', 'elegir proveedor'])) {
      if (role !== 'CLIENTE') {
        this.say('La seleccion de proveedor corresponde al flujo del cliente.');
        return true;
      }

      this.selectBestProvider();
      return true;
    }

    if (this.includesAny(normalized, ['confirmar pedido', 'confirmar solicitud', 'realizar pedido', 'crear pedido'])) {
      if (role !== 'CLIENTE') {
        this.say('La confirmacion de pedido corresponde al cliente.');
        return true;
      }

      await this.startOrderConfirmation(normalized);
      return true;
    }

    if (this.includesAny(normalized, ['actualiza mi cuenta', 'actualizar mi cuenta', 'cambiar mi perfil', 'actualiza mi perfil', 'cambia mi telefono', 'cambia mi whatsapp', 'cambia mi direccion', 'cambia mi correo', 'cambia mi ruc', 'cambia mi razon social', 'cambia mi descripcion'])) {
      await this.startProfileUpdate(normalized);
      return true;
    }

    if (this.includesAny(normalized, ['cambiar plan', 'actualizar plan', 'abrir planes', 'ver planes', 'plan del proveedor'])) {
      if (role !== 'PROVEEDOR') {
        this.say('Ese cambio de plan está disponible para proveedores. Te ayudo a navegar al panel correcto.');
        return true;
      }

      window.dispatchEvent(new CustomEvent('voiceOpenProviderPlans'));
      this.say('Abriendo la gestión de planes del proveedor.');
      return true;
    }

    return false;
  }

  private async continuePending(text: string, normalized: string): Promise<boolean> {
    const pending = this.pending;
    this.pending = null;

    if (!pending) {
      return false;
    }

    if (pending.type === 'TRACKING_ID') {
      const id = this.extractRequestId(normalized);
      if (!id) {
        this.pending = pending;
        this.say('Aun no veo un numero de solicitud. Dime algo como RFQ 2026 12 o solicitud 12.');
        return true;
      }
      this.openTracking(id);
      return true;
    }

    if (pending.type === 'ADD_PRODUCT') {
      await this.addProductToCart(text, pending.qty);
      return true;
    }

    if (pending.type === 'PROFILE_FIELD') {
      const field = this.detectProfileField(normalized);
      if (!field) {
        this.pending = pending;
        this.say(`Puedo cambiar ${this.allowedProfileFieldsLabel()}. Dime cual campo quieres actualizar.`);
        return true;
      }
      if (!this.canUpdateProfileField(field)) {
        this.say(`Ese campo no esta disponible para tu rol. Puedes actualizar ${this.allowedProfileFieldsLabel()}.`);
        return true;
      }
      this.pending = { type: 'PROFILE_VALUE', field };
      this.say(`Perfecto. Dime el nuevo valor para ${this.profileFieldLabel(field)}.`);
      return true;
    }

    if (pending.type === 'PROFILE_VALUE') {
      if (!this.canUpdateProfileField(pending.field)) {
        this.say(`Ese campo no esta disponible para tu rol. Puedes actualizar ${this.allowedProfileFieldsLabel()}.`);
        return true;
      }
      await this.updateProfileField(pending.field, text.trim());
      return true;
    }

    if (pending.type === 'PROFILE_MFA_CODE') {
      await this.completeVoiceProfileUpdate(pending, text);
      return true;
    }

    if (pending.type === 'ORDER_RUC') {
      const ruc = this.extractRuc(normalized);
      if (!ruc) {
        this.pending = pending;
        this.say('Necesito un RUC de 11 digitos para registrar la empresa compradora.');
        return true;
      }
      this.pending = { type: 'ORDER_ADDRESS', ruc };
      this.say('Ahora dime la direccion de entrega.');
      return true;
    }

    if (pending.type === 'ORDER_ADDRESS') {
      await this.confirmOrder(pending.ruc, text.trim());
      return true;
    }

    return true;
  }

  private logout(): void {
    this.themeService.resetToDefault();
    localStorage.removeItem(APP_STORAGE_KEYS.token);
    localStorage.removeItem(APP_STORAGE_KEYS.role);
    localStorage.removeItem(APP_STORAGE_KEYS.rfqCart);
    localStorage.removeItem(APP_STORAGE_KEYS.selectedProvider);
    localStorage.removeItem(APP_STORAGE_KEYS.currentSolicitudId);
    localStorage.removeItem('auth_user_email');
    localStorage.removeItem('auth_user_id');
    sessionStorage.removeItem('pending_mfa_flow');
    this.say('Sesion cerrada. Te llevo al login.');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  private openTracking(id: number): void {
    this.say(`Abriendo seguimiento de la solicitud ${id}.`);
    this.router.navigate(['/app/requests/tracking', id]);
  }

  private async addProductToCart(query: string, qty: number): Promise<void> {
    this.thinking = true;

    try {
      const products = await this.fetchProducts();
      const normalizedQuery = this.normalize(query);
      const product = this.findBestProduct(products, normalizedQuery);

      if (!product) {
        this.thinking = false;
        const fallback = buildProductNotFoundAction(query);
        this.pending = null;
        this.say(fallback.message);
        this.router.navigate([fallback.navigateTo], { queryParams: { search: query } });
        return;
      }

      const cart = this.readCart();
      const existing = cart.find((item: any) => item.idProducto === product.idProducto);

      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({
          idProducto: product.idProducto,
          name: product.producto,
          detail: `${product.marca || ''} - ${String(product.descripcion || '').substring(0, 30)}...`,
          qty,
          precioReferencia: product.precioUnitario ?? null,
          categoria: product.categoria,
          marca: product.marca
        });
      }

      localStorage.setItem(APP_STORAGE_KEYS.rfqCart, JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('voiceCartUpdated', { detail: cart }));
      this.thinking = false;
      this.say(`Agregue ${qty} unidad${qty === 1 ? '' : 'es'} de ${product.producto} al carrito RFQ.`);
      this.router.navigate(['/app/rfq/catalog'], { queryParams: { search: product.producto } });
    } catch {
      this.thinking = false;
      this.say('No pude consultar el catalogo para agregar el producto.');
    }
  }

  private async createRfqFromCart(): Promise<void> {
    const cart = this.readCart();

    if (!cart.length) {
      this.pending = { type: 'ADD_PRODUCT', qty: 1 };
      this.say('Tu carrito RFQ esta vacio. Dime que producto necesitas y lo agrego primero.');
      return;
    }

    this.thinking = true;
    this.http.post<any[]>(`${APP_API_BASE_URL}/rfq/buscar-proveedores`, {
      items: cart.map((item: any) => ({
        idProducto: item.idProducto,
        cantidad: item.qty
      })),
      filtro: {
        precioMin: null,
        precioMax: null,
        marcas: [],
        categorias: []
      },
      prioridad: 'BALANCEADO'
    }, {
      headers: this.headers()
    }).subscribe({
      next: providers => {
        this.thinking = false;
        sessionStorage.setItem('voice_last_providers', JSON.stringify(providers || []));
        this.say(`Encontré ${(providers || []).length} proveedores compatibles. Primero elige un proveedor. Luego te pediré el RUC y la dirección para crear la solicitud.`);
        this.router.navigate(['/app/rfq/results'], { state: { proveedores: providers || [] } });
      },
      error: () => {
        this.thinking = false;
        this.say('No pude buscar proveedores para tu carrito. Revisa los productos e intenta nuevamente.');
      }
    });
  }

  private selectBestProvider(): void {
    const raw = sessionStorage.getItem('voice_last_providers');
    const providers = raw ? JSON.parse(raw) : [];
    const provider = providers?.[0];

    if (!provider) {
      this.say('No tengo proveedores calculados todavia. Primero dime crear solicitud o buscar proveedores.');
      return;
    }

    localStorage.setItem(APP_STORAGE_KEYS.selectedProvider, JSON.stringify(provider));
    this.say(`Seleccione a ${provider.nombreProveedor || 'el mejor proveedor'}. Te llevo al detalle de cotizacion.`);
    this.router.navigate(['/app/rfq/quotation']);
  }

  private openProviderRanking(): void {
    this.say('Te muestro el ranking de proveedores mejor evaluados. Agrega productos al RFQ para buscar proveedores compatibles y crear una solicitud.');
    this.router.navigate(['/app/rfq/catalog'], { queryParams: { tab: 'proveedores' } });
  }

  private async startOrderConfirmation(normalized: string): Promise<void> {
    const provider = this.readSelectedProvider();
    if (!provider) {
      this.say('Primero debes seleccionar un proveedor. Si ya buscaste proveedores, dime elegir mejor proveedor.');
      return;
    }

    const ruc = this.extractRuc(normalized);
    if (!ruc) {
      this.pending = { type: 'ORDER_RUC' };
      this.say('Proveedor seleccionado. Para crear la solicitud necesito el RUC de la empresa compradora.');
      return;
    }

    this.pending = { type: 'ORDER_ADDRESS', ruc };
    this.say('RUC recibido. Ahora dime la dirección de entrega.');
  }

  private async confirmOrder(ruc: string, address: string): Promise<void> {
    if (!address) {
      this.pending = { type: 'ORDER_ADDRESS', ruc };
      this.say('Necesito una direccion de entrega para continuar.');
      return;
    }

    const provider = this.readSelectedProvider();
    if (!provider) {
      this.say('Ya no encuentro el proveedor seleccionado. Vuelve a seleccionar uno.');
      return;
    }

    const products = provider.items ?? provider.itemsDetalle ?? provider.productos ?? [];
    const total = Number(provider.totalCotizacion || 0);
    const subtotal = Number((total / 1.18).toFixed(2));
    const igv = Number((total - subtotal).toFixed(2));

    this.thinking = true;

    this.http.post<any>(`${APP_API_BASE_URL}/empresas`, { ruc }, { headers: this.headers() })
      .subscribe({
        next: empresa => {
          this.http.post<any>(`${APP_API_BASE_URL}/solicitudes/crear`, {
            idEmpresa: empresa.idEmpresa,
            idProveedor: provider.idProveedor,
            subtotal,
            igv,
            total,
            direccionEnvio: address,
            items: products.map((p: any) => ({
              idProducto: p.idProducto,
              cantidad: Number(p.cantidad ?? p.qty ?? 1),
              precioUnitario: Number(p.precioUnitario ?? p.precioReferencia ?? 0)
            }))
          }, { headers: this.headers() }).subscribe({
            next: res => {
              if (!res?.idSolicitud) {
                this.thinking = false;
                this.say('El backend respondio, pero no confirmo el numero de solicitud. Revisa tus solicitudes antes de continuar.');
                return;
              }
              localStorage.setItem(APP_STORAGE_KEYS.currentSolicitudId, String(res.idSolicitud));
              localStorage.removeItem(APP_STORAGE_KEYS.rfqCart);
              localStorage.removeItem(APP_STORAGE_KEYS.selectedProvider);
              this.thinking = false;
              this.say(`Solicitud creada correctamente. La abro en tus solicitudes.`);
              this.router.navigate(['/app/requests']);
            },
            error: () => {
              this.thinking = false;
              this.say('No pude crear la solicitud. Revisa la cotizacion e intenta nuevamente.');
            }
          });
        },
        error: () => {
          this.thinking = false;
          this.say('No pude registrar o validar la empresa con ese RUC.');
        }
      });
  }

  private async startProfileUpdate(normalized: string): Promise<void> {
    const field = this.detectProfileField(normalized);
    const value = field ? this.extractProfileValue(normalized, field) : '';

    if (!field) {
      this.pending = { type: 'PROFILE_FIELD' };
      this.say(`Puedo actualizar ${this.allowedProfileFieldsLabel()}. Que campo quieres cambiar?`);
      return;
    }

    if (!this.canUpdateProfileField(field)) {
      this.say(`Ese campo no esta disponible para tu rol. Puedes actualizar ${this.allowedProfileFieldsLabel()}.`);
      return;
    }

    if (!value) {
      this.pending = { type: 'PROFILE_VALUE', field };
      this.say(`Dime el nuevo valor para ${this.profileFieldLabel(field)}.`);
      return;
    }

    await this.updateProfileField(field, value);
  }

  private async updateProfileField(field: string, value: string): Promise<void> {
    if (!this.canUpdateProfileField(field)) {
      this.say(`Ese campo no esta disponible para tu rol. Puedes actualizar ${this.allowedProfileFieldsLabel()}.`);
      return;
    }

    if (!value.trim()) {
      this.pending = { type: 'PROFILE_VALUE', field };
      this.say(`Necesito el nuevo valor para ${this.profileFieldLabel(field)}.`);
      return;
    }

    this.thinking = true;

    try {
      const profile: any = await this.http.get(`${APP_API_BASE_URL}/usuarios/perfil`, { headers: this.headers() }).toPromise();
      const currentEmail = localStorage.getItem('auth_user_email') || profile?.correo || '';
      const next = { ...profile, [field]: value.trim() };
      const formData = this.buildProfileFormData(next);
      const validationError = this.validateProfilePatch(field, value.trim(), next);
      if (validationError) {
        this.thinking = false;
        this.say(validationError);
        return;
      }

      const method = this.preferredVoiceMfaMethod(profile);
      const mfaToken = await this.mfaService.requestActionToken(currentEmail, 'PROFILE_UPDATE', method);

      window.dispatchEvent(new CustomEvent('voiceProfilePatch', {
        detail: { field, value: value.trim(), profile: next }
      }));

      this.thinking = false;
      await this.http.put(`${APP_API_BASE_URL}/usuarios/perfil`, formData, {
        headers: this.authOnlyHeaders().set('X-MFA-Authorization', mfaToken)
      }).toPromise();

      if (field === 'correo') {
        localStorage.setItem('auth_user_email', value.trim());
      }

      window.dispatchEvent(new CustomEvent('profileUpdated'));
      this.say(`${this.profileFieldLabel(field)} guardado correctamente.`);
      this.router.navigate(['/app/profile']);
    } catch (error: any) {
      this.thinking = false;
      this.say(error?.message || 'No pude actualizar tu perfil.');
    }
  }

  private async completeVoiceProfileUpdate(pending: Extract<NonNullable<typeof this.pending>, { type: 'PROFILE_MFA_CODE' }>, text: string): Promise<void> {
    const code = this.extractMfaCode(text);

    if (!code) {
      this.pending = pending;
      this.say('Necesito el código MFA de 6 dígitos para guardar el cambio.');
      return;
    }

    this.thinking = true;

    try {
      const verified = await this.mfaService.verifyChallenge(
        pending.email,
        pending.tempToken,
        code,
        'PROFILE_UPDATE',
        pending.method
      );

      const mfaToken = verified?.mfaActionToken;
      if (!mfaToken) {
        throw new Error('No se pudo obtener la autorización multifactor.');
      }

      await this.http.put(`${APP_API_BASE_URL}/usuarios/perfil`, pending.formData, {
        headers: this.authOnlyHeaders().set('X-MFA-Authorization', mfaToken)
      }).toPromise();

      if (pending.field === 'correo') {
        localStorage.setItem('auth_user_email', pending.value);
      }

      window.dispatchEvent(new CustomEvent('profileUpdated'));
      this.thinking = false;
      this.say(`${this.profileFieldLabel(pending.field)} guardado correctamente.`);
      this.router.navigate(['/app/profile']);
    } catch (error: any) {
      this.thinking = false;
      this.pending = pending;
      this.say(error?.error?.message || error?.message || 'No pude validar el MFA. Dime el código otra vez.');
    }
  }

  private buildProfileFormData(profile: any): FormData {
    const formData = new FormData();

    formData.append('nombres', profile.nombres || '');
    formData.append('apellidos', profile.apellidos || '');
    formData.append('correo', profile.correo || '');
    formData.append('telefono', profile.telefono || '');
    formData.append('whatsapp', profile.whatsapp || '');
    formData.append('direccion', profile.direccion || '');
    formData.append('razonSocial', profile.razonSocial || '');
    formData.append('ruc', profile.ruc || '');
    formData.append('descripcion', profile.descripcion || '');
    formData.append('notificaciones', String(profile.notificacionesRfq ?? profile.preferencias?.notificaciones ?? true));
    formData.append('entregaRapida', String(profile.entregaRapida ?? profile.preferencias?.entregaRapida ?? false));

    return formData;
  }

  private preferredVoiceMfaMethod(profile: any): string {
    if (profile?.whatsapp || profile?.telefono) {
      return 'whatsapp';
    }

    return 'email';
  }

  private validateProfilePatch(field: string, value: string, profile: any): string {
    const rules: Record<string, { pattern: RegExp; message: string }> = {
      nombres: {
        pattern: /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$/,
        message: 'Nombre invalido. Debe iniciar con mayuscula y usar solo letras, por ejemplo Juan Carlos.'
      },
      apellidos: {
        pattern: /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$/,
        message: 'Apellido invalido. Debe iniciar con mayuscula y usar solo letras, por ejemplo Perez Ramos.'
      },
      correo: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        message: 'Correo invalido. Usa un formato como usuario@empresa.com.'
      },
      telefono: {
        pattern: /^(?:\+51\s?)?9\d{8}$/,
        message: 'Telefono invalido. Debe ser celular peruano de 9 digitos e iniciar con 9.'
      },
      whatsapp: {
        pattern: /^(?:\+51\s?)?9\d{8}$/,
        message: 'WhatsApp invalido. Debe ser celular peruano de 9 digitos e iniciar con 9.'
      },
      direccion: {
        pattern: /^[A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .,#°º/-]{4,149}$/,
        message: 'Direccion invalida. Debe iniciar con mayuscula o numero y tener al menos 5 caracteres.'
      },
      ruc: {
        pattern: /^(10|20)\d{9}$/,
        message: 'RUC invalido. Debe tener 11 digitos y empezar con 10 o 20.'
      },
      razonSocial: {
        pattern: /^[A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .,&-]{2,119}$/,
        message: 'Razon social invalida. Debe iniciar con mayuscula o numero y tener al menos 3 caracteres.'
      },
      descripcion: {
        pattern: /^[A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .,#°º/&()-]{9,399}$/,
        message: 'Descripcion invalida. Debe iniciar con mayuscula o numero y tener entre 10 y 400 caracteres.'
      }
    };

    const rule = rules[field];
    if (!rule) {
      return '';
    }

    const normalizedValue = ['telefono', 'whatsapp'].includes(field)
      ? value.replace(/\D/g, '')
      : value;

    if (!rule.pattern.test(normalizedValue)) {
      return rule.message;
    }

    if (field === 'ruc' && (profile?.rol || '').toUpperCase().includes('PROVEEDOR') && !rule.pattern.test(value)) {
      return rule.message;
    }

    return '';
  }

  private mfaMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      whatsapp: 'WhatsApp',
      sms: 'SMS',
      call: 'llamada',
      email: 'correo'
    };

    return labels[method] || method;
  }

  private fetchProducts(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.http.post<any[]>(`${APP_API_BASE_URL}/productos/catalogo/filtrado`, {
        categorias: null,
        marcas: null,
        especificaciones: []
      }, {
        headers: this.headers()
      }).subscribe({
        next: res => resolve(Array.isArray(res) ? res : []),
        error: reject
      });
    });
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`,
      'Content-Type': 'application/json'
    });
  }

  private authOnlyHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

  private readCart(): any[] {
    const raw = localStorage.getItem(APP_STORAGE_KEYS.rfqCart);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private readSelectedProvider(): any | null {
    const raw = localStorage.getItem(APP_STORAGE_KEYS.selectedProvider);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private say(text: string): void {
    this.answer = text;
    this.showVoiceStatus();
    this.speak(text);
  }

  private showVoiceStatus(): void {
    this.clearVoiceStatusRemovalTimer();
    this.statusRendered = true;
    this.statusVisible = true;
    this.cdr.markForCheck();

    this.clearVoiceStatusTimer();
    this.voiceStatusTimer = window.setTimeout(() => {
      if (!this.listening && !this.thinking) {
        this.statusVisible = false;
        this.cdr.markForCheck();
        this.voiceStatusRemovalTimer = window.setTimeout(() => {
          this.statusRendered = false;
          this.cdr.markForCheck();
          this.answer = '';
          this.transcript = '';
          this.voiceStatusRemovalTimer = null;
          this.cdr.markForCheck();
        }, this.voiceStatusFadeMs);
      }
    }, this.voiceStatusDurationMs);
  }

  private clearVoiceStatusTimer(): void {
    if (this.voiceStatusTimer) {
      window.clearTimeout(this.voiceStatusTimer);
      this.voiceStatusTimer = null;
    }
  }

  private clearVoiceStatusRemovalTimer(): void {
    if (this.voiceStatusRemovalTimer) {
      window.clearTimeout(this.voiceStatusRemovalTimer);
      this.voiceStatusRemovalTimer = null;
    }
  }

  private clearVoiceStatus(): void {
    this.clearVoiceStatusTimer();
    this.clearVoiceStatusRemovalTimer();
    this.statusRendered = false;
    this.statusVisible = false;
    this.cdr.markForCheck();
    this.answer = '';
    this.transcript = '';
    this.cdr.markForCheck();
  }

  private normalize(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s@.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private allowedRouteForRole(role: string, route: string): string | null {
    const normalizedRole = role.toUpperCase();
    const normalizedRoute = (route || '').toLowerCase();

    if (normalizedRole === 'ADMIN') {
      return normalizedRoute.includes('/app/admin/') || normalizedRoute.includes('/app/profile') || normalizedRoute.includes('/app/dashboard')
        ? route
        : null;
    }

    if (normalizedRole === 'PROVEEDOR') {
      return normalizedRoute.includes('/app/provider/') || normalizedRoute.includes('/app/profile')
        ? route
        : null;
    }

    return normalizedRoute.includes('/app/rfq/')
      || normalizedRoute.includes('/app/requests')
      || normalizedRoute.includes('/app/history')
      || normalizedRoute.includes('/app/profile')
      || normalizedRoute.includes('/app/dashboard')
      ? route
      : null;
  }

  private allowedSearchRouteForRole(role: string): string | null {
    const normalizedRole = role.toUpperCase();

    if (normalizedRole === 'PROVEEDOR') {
      return '/app/provider/products';
    }

    if (normalizedRole === 'ADMIN') {
      return '/app/admin/products';
    }

    return '/app/rfq/catalog';
  }

  private normalizeRole(value: string | null | undefined): string {
    return (value || '').toUpperCase().replace(/^ROLE_/, '').trim();
  }

  private includesAny(value: string, terms: string[]): boolean {
    return terms.some(term => value.includes(this.normalize(term)));
  }

  private extractRequestId(value: string): number | null {
    const rfq = value.match(/rfq\s*(?:2026)?\s*(\d+)/i);
    const generic = value.match(/(?:solicitud|pedido|numero)\s*(\d+)/i);
    const anyNumber = value.match(/\b(\d{1,6})\b/);
    const match = rfq || generic || anyNumber;
    return match ? Number(match[1]) : null;
  }

  private extractQuantity(value: string): number | null {
    const match = value.match(/\b(\d{1,3})\b/);
    return match ? Math.max(1, Number(match[1])) : null;
  }

  private extractRuc(value: string): string {
    return value.replace(/\D/g, '').match(/\d{11}/)?.[0] || '';
  }

  private extractMfaCode(value: string): string {
    return value.replace(/\D/g, '').match(/\d{6}/)?.[0] || '';
  }

  private cleanProductQuery(value: string): string {
    return value
      .replace(/\b(agrega|agregar|anade|añade|pon|en|al|carrito|un|una|unos|unas|\d+|producto|productos|por favor)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private findBestProduct(products: any[], query: string): any | null {
    const terms = query.split(' ').filter(term => term.length > 1);
    if (!terms.length) {
      return null;
    }

    const ranked = products
      .map(product => ({
        product,
        score: this.productScore(product, query, terms)
      }))
      .sort((a, b) => b.score - a.score);

    return ranked[0]?.score >= 0.42 ? ranked[0].product : null;
  }

  private productScore(product: any, query: string, terms: string[]): number {
    const haystack = this.normalize([
      product.producto,
      product.marca,
      product.categoria,
      product.descripcion,
      ...(product.especificaciones || []).map((spec: any) => `${spec?.nombre || ''} ${spec?.valor || ''}`)
    ].filter(Boolean).join(' '));

    const exactName = this.normalize(product.producto || '');
    let score = exactName.includes(query) || query.includes(exactName) ? 0.45 : 0;

    const matched = terms.filter(part =>
      haystack.includes(part) ||
      haystack.split(' ').some(word => this.levenshtein(word, part) <= Math.max(1, Math.floor(part.length * 0.25)))
    ).length;

    score += matched / terms.length * 0.45;

    if (this.normalize(product.marca || '').split(' ').some((brand: string) => terms.includes(brand))) {
      score += 0.08;
    }

    if (this.normalize(product.categoria || '').split(' ').some((category: string) => terms.includes(category))) {
      score += 0.08;
    }

    return Math.min(1, score);
  }

  private levenshtein(a: string, b: string): number {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }

    return matrix[b.length][a.length];
  }

  private random(options: string[]): string {
    return options[Math.floor(Math.random() * options.length)] || options[0];
  }

  private detectProfileField(value: string): string {
    if (value.includes('telefono') || value.includes('celular')) return 'telefono';
    if (value.includes('whatsapp')) return 'whatsapp';
    if (value.includes('direccion')) return 'direccion';
    if (value.includes('correo') || value.includes('email')) return 'correo';
    if (value.includes('ruc')) return 'ruc';
    if (value.includes('razon social') || value.includes('empresa')) return 'razonSocial';
    if (value.includes('descripcion') || value.includes('descripción')) return 'descripcion';
    if (value.includes('nombre')) return 'nombres';
    if (value.includes('apellido')) return 'apellidos';
    return '';
  }

  private extractProfileValue(value: string, field: string): string {
    const label = this.normalize(this.profileFieldLabel(field));
    const patterns = [
      new RegExp(`${field}\\s+(?:a|por|es)\\s+(.+)$`),
      new RegExp(`${label}\\s+(?:a|por|es)\\s+(.+)$`),
      /(?:a|por|es)\s+(.+)$/
    ];

    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    return '';
  }

  private profileFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      telefono: 'telefono',
      whatsapp: 'WhatsApp',
      direccion: 'direccion',
      correo: 'correo',
      nombres: 'nombres',
      apellidos: 'apellidos',
      ruc: 'RUC',
      razonSocial: 'razon social',
      descripcion: 'descripcion'
    };

    return labels[field] || field;
  }

  private canUpdateProfileField(field: string): boolean {
    const role = (localStorage.getItem(APP_STORAGE_KEYS.role) || '').toUpperCase();
    const common = ['telefono', 'whatsapp', 'direccion', 'correo', 'nombres', 'apellidos'];
    const providerOnly = ['ruc', 'razonSocial', 'descripcion'];

    if (common.includes(field)) {
      return true;
    }

    if (providerOnly.includes(field)) {
      return role === 'PROVEEDOR';
    }

    return false;
  }

  private allowedProfileFieldsLabel(): string {
    const role = (localStorage.getItem(APP_STORAGE_KEYS.role) || '').toUpperCase();
    const fields = ['telefono', 'WhatsApp', 'direccion', 'nombres', 'apellidos', 'correo'];

    if (role === 'PROVEEDOR') {
      fields.push('RUC', 'razon social', 'descripcion');
    }

    return fields.join(', ');
  }
}
