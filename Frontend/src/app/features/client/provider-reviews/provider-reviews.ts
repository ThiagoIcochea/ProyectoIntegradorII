import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-provider-reviews',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './provider-reviews.html',
  styleUrl: './provider-reviews.scss'
})
export class ProviderReviewsComponent implements OnInit {

  product: any = null;
  selectedProvider: any = null;
  origin: string | null = null;

  idProductoActual: number | null = null;

  requestItems: any[] = [];
  providers: any[] = [];
  initialProvidersLoaded = false;

  qty: number = 1;
  loadingProviders: boolean = true;
  expandedProviderKey: string | null = null;
  productImageFailed = false;

  reviewDrafts: {
    [key: string]: {
      comentario: string;
      error: string;
    }
  } = {};

  private readonly API_BASE = APP_API_BASE_URL;
  private readonly loadedCommentKeys = new Set<string>();
  private readonly loadingCommentKeys = new Set<string>();
  private readonly loadedIndicatorIds = new Set<number>();
  private readonly loadingIndicatorIds = new Set<number>();

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state ?? history.state;

    this.product = state?.['product'] ?? null;
    this.origin = state?.['origen'] ?? state?.['origin'] ?? null;

    this.idProductoActual =
      state?.['idProducto'] ||
      this.product?.idProducto ||
      this.product?.id_producto ||
      null;

    const stateProvider =
      state?.['proveedor'] ??
      state?.['provider'] ??
      null;

    if (stateProvider) {
      this.selectedProvider = this.normalizarProveedor(stateProvider);
      this.providers = [this.selectedProvider];

      this.expandedProviderKey = this.getProviderKey(
        this.selectedProvider,
        0
      );

      this.loadingProviders = false;
      return;
    }

    const stateProviders =
      state?.['proveedores'] ??
      state?.['providers'];

    if (Array.isArray(stateProviders)) {
      this.setProviderList(
        this.filterProvidersForProduct(stateProviders)
      );

      this.loadingProviders = false;
      this.initialProvidersLoaded = true;
    }
  }

  ngOnInit(): void {
    this.cargarCarritoLocal();

    if (!this.product && !this.selectedProvider) {
      this.router.navigate(['/app/rfq/catalog']);
      return;
    }

    if (this.selectedProvider) {
      this.cargarIndicadoresProveedor(this.selectedProvider);

      if (this.idProductoActual) {
        this.cargarComentariosProveedor(this.selectedProvider);
      } else {
        this.recalcularMetricasProveedor(this.selectedProvider);
      }

      this.loadingProviders = false;
      return;
    }

    if (this.loadingProviders) {
      this.cargarProveedoresDelProducto();
      return;
    }

  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  cargarCarritoLocal(): void {
    const saved = localStorage.getItem('rfq_cart');

    if (saved) {
      this.requestItems = JSON.parse(saved);
    }
  }

  guardarCarritoLocal(): void {
    localStorage.setItem('rfq_cart', JSON.stringify(this.requestItems));
  }

  cargarProveedoresDelProducto(): void {
    if (!this.product) {
      return;
    }

    const idProducto =
      this.idProductoActual ||
      this.product?.idProducto ||
      this.product?.id_producto;

    if (!idProducto) {
      console.error('No se encontró idProducto para cargar proveedores.');
      this.providers = [];
      this.loadingProviders = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadingProviders = true;

    const providersFromProduct = this.getProvidersFromProduct();

    if (providersFromProduct.length > 0) {
      this.setProviderList(providersFromProduct);

      this.loadingProviders = false;
      this.cdr.detectChanges();
      return;
    }

    const request = {
      items: [
        {
          idProducto,
          cantidad: 1
        }
      ],
      filtro: {
        precioMin: null,
        precioMax: null,
        marcas: [],
        categorias: []
      },
      prioridad: 'BALANCEADO'
    };

    this.http.post<any>(
      `${this.API_BASE}/rfq/buscar-proveedores`,
      request,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        const proveedoresRaw =
          Array.isArray(res)
            ? res
            : res?.proveedores ||
              res?.proveedoresSeleccionados ||
              res?.data ||
              [];

        this.setProviderList(proveedoresRaw);

        this.loadingProviders = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar proveedores', err);

        this.providers = [];
        this.loadingProviders = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarComentariosProveedor(provider: any, force = false): void {
    const idProveedor =
      provider?.idProveedor ||
      provider?.id_proveedor ||
      provider?.idProvider ||
      provider?.id;

    const idProducto =
      this.idProductoActual ||
      this.product?.idProducto ||
      this.product?.id_producto;

    if (!idProveedor || !idProducto) {
      console.warn('No se puede cargar comentarios. Falta idProveedor o idProducto.', {
        idProveedor,
        idProducto,
        provider,
        product: this.product
      });

      provider.comentarios = Array.isArray(provider?.comentarios)
        ? provider.comentarios.map((comentario: any) => this.normalizarComentario(comentario))
        : [];

      this.recalcularMetricasProveedor(provider);
      this.cdr.detectChanges();
      return;
    }

    const providerId = Number(idProveedor);
    const commentKey = `${providerId}:${Number(idProducto)}`;

    if (this.loadingCommentKeys.has(commentKey) || (!force && this.loadedCommentKeys.has(commentKey))) {
      return;
    }

    this.loadingCommentKeys.add(commentKey);

    this.http.get<any[]>(
      `${this.API_BASE}/comentarios/${idProveedor}/${idProducto}`,
      { headers: this.getHeaders() }
    ).pipe(
      finalize(() => this.loadingCommentKeys.delete(commentKey))
    ).subscribe({
      next: (res) => {
        this.loadedCommentKeys.add(commentKey);
        const comentarios = this.extractCommentsPayload(res)
          .map((comentario: any) => this.normalizarComentario(comentario));

        const index = this.providers.findIndex(
          p => Number(p.idProveedor ?? p.id_proveedor ?? p.id ?? p.idProvider) === providerId
        );

        const current = index !== -1 ? this.providers[index] : provider;

        const providerActualizado = {
          ...current,
          comentarios
        };

        this.recalcularMetricasProveedor(providerActualizado);

        if (index !== -1) {
          this.providers = [
            ...this.providers.slice(0, index),
            providerActualizado,
            ...this.providers.slice(index + 1)
          ];
        }

        if (
          this.selectedProvider &&
          Number(this.selectedProvider.idProveedor ?? this.selectedProvider.id_proveedor ?? this.selectedProvider.id ?? this.selectedProvider.idProvider) === providerId
        ) {
          this.selectedProvider = {
            ...providerActualizado
          };
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando comentarios del proveedor para este producto', err);

        const index = this.providers.findIndex(
          p => Number(p.idProveedor ?? p.id_proveedor ?? p.id ?? p.idProvider) === providerId
        );

        const current = index !== -1 ? this.providers[index] : provider;

        const providerActualizado = {
          ...current,
          comentarios: []
        };

        this.recalcularMetricasProveedor(providerActualizado);

        if (index !== -1) {
          this.providers = [
            ...this.providers.slice(0, index),
            providerActualizado,
            ...this.providers.slice(index + 1)
          ];
        }

        if (
          this.selectedProvider &&
          Number(this.selectedProvider.idProveedor ?? this.selectedProvider.id_proveedor ?? this.selectedProvider.id ?? this.selectedProvider.idProvider) === providerId
        ) {
          this.selectedProvider = {
            ...providerActualizado
          };
        }

        this.cdr.detectChanges();
      }
    });
  }


 normalizarComentario(comentario: any): any {

  const rawTipo = String(
    comentario?.tipo ??
    comentario?.type ??
    comentario?.reactionType ??
    comentario?.tipoReaccion ??
    ''
  ).trim().toUpperCase();

  const tipoNormalizado =
    rawTipo === 'DISLIKE' ||
    rawTipo === 'NEGATIVO' ||
    rawTipo === 'NEGATIVE'
      ? 'DISLIKE'
      : rawTipo === 'LIKE' ||
        rawTipo === 'POSITIVO' ||
        rawTipo === 'POSITIVE'
        ? 'LIKE'
        : 'NEUTRAL';

  return {
    ...comentario,

    idComentario:
      comentario?.idComentario ||
      comentario?.id_comentario ||
      comentario?.id ||
      null,

    idProvProd:
      comentario?.idProvProd ||
      comentario?.id_prov_prod ||
      null,

    idUsuario:
      comentario?.idUsuario ||
      comentario?.id_usuario ||
      null,

    comentario:
      comentario?.comentario ||
      comentario?.review ||
      comentario?.texto ||
      comentario?.mensaje ||
      '',

    tipo: tipoNormalizado,
    sentimiento: rawTipo || tipoNormalizado,

    fecha:
      comentario?.fecha ||
      comentario?.date ||
      comentario?.createdAt ||
      comentario?.created_at ||
      null,

    likes:
      Number(comentario?.likes ?? comentario?.likesCount ?? comentario?.totalLikes ?? 0),

    dislikes:
      Number(comentario?.dislikes ?? comentario?.dislikesCount ?? comentario?.totalDislikes ?? 0),

    likesCount:
      Number(comentario?.likes ?? comentario?.likesCount ?? comentario?.totalLikes ?? 0),

    dislikesCount:
      Number(comentario?.dislikes ?? comentario?.dislikesCount ?? comentario?.totalDislikes ?? 0),

    userReaction:
      comentario?.userReaction ??
      comentario?.reaccion ??
      comentario?.reaction ??
      null
    ,

    usuarioNombre:
      comentario?.usuarioNombre ?? comentario?.usuario?.nombre ?? comentario?.user?.name ?? comentario?.author ?? 'Usuario',

    puntuacion:
      Number(comentario?.puntuacion ?? comentario?.puntaje ?? comentario?.rating ?? comentario?.score ?? 0),

    fechaFormateada: comentario?.fecha ? new Date(comentario.fecha).toLocaleString('es-PE') : 'No disponible'
  };
}

  contarReacciones(reacciones: any[], tipo: 'LIKE' | 'DISLIKE'): number {
    if (!Array.isArray(reacciones)) {
      return 0;
    }

    return reacciones.filter(reaccion => reaccion?.tipo === tipo).length;
  }

  

  recalcularMetricasProveedor(provider: any): void {
    const comentarios = Array.isArray(provider?.comentarios)
      ? provider.comentarios
      : [];

    let commentLikes = 0;
    let commentDislikes = 0;

    comentarios.forEach((comentario: any) => {
      commentLikes += this.getReviewLikes(comentario);
      commentDislikes += this.getReviewDislikes(comentario);

      if (
        this.getReviewLikes(comentario) === 0 &&
        this.getReviewDislikes(comentario) === 0
      ) {
        if (comentario?.tipo === 'DISLIKE') {
          commentDislikes++;
        } else {
          commentLikes++;
        }
      }
    });

    const hasIndicatorReactionTotals =
      Number(provider?.likes ?? 0) > 0 ||
      Number(provider?.dislikes ?? 0) > 0;

    provider.totalComentarios = comentarios.length;
    provider.likes = hasIndicatorReactionTotals
      ? Number(provider.likes ?? 0)
      : commentLikes;
    provider.dislikes = hasIndicatorReactionTotals
      ? Number(provider.dislikes ?? 0)
      : commentDislikes;

    const totalReacciones = provider.likes + provider.dislikes;
    if (totalReacciones > 0) {
      provider.satisfaccion = Math.round((provider.likes / totalReacciones) * 100);
    }
  }

  private recalculateProviderReviewMetrics(provider: any): void {
    this.recalcularMetricasProveedor(provider);
  }

  cargarIndicadoresProveedor(provider: any, force = false): void {
    const idProveedor =
      provider?.idProveedor ?? provider?.id_proveedor ?? provider?.idProvider ?? provider?.id;

    if (!idProveedor) return;

    const providerId = Number(idProveedor);
    if (this.loadingIndicatorIds.has(providerId) || (!force && this.loadedIndicatorIds.has(providerId))) {
      return;
    }

    this.loadingIndicatorIds.add(providerId);

    this.http.get<any>(
      `${this.API_BASE}/provider/${idProveedor}/indicadores`,
      { headers: this.getHeaders() }
    ).pipe(
      finalize(() => this.loadingIndicatorIds.delete(providerId))
    ).subscribe({
      next: (res) => {
        this.loadedIndicatorIds.add(providerId);
        const index = this.providers.findIndex(
          p => Number(p.idProveedor ?? p.id_proveedor ?? p.id ?? p.idProvider) === Number(idProveedor)
        );

        const payload = this.extractIndicatorPayload(res);
        const current = index !== -1
          ? this.providers[index]
          : provider;

        const feedback = {
          providerId: idProveedor,
          index,
          currentId: current?.idProveedor ?? current?.id_proveedor ?? current?.idProvider ?? current?.id,
          currentName: this.getProviderName(current),
          response: res,
          payload
        };

        if (!payload || typeof payload !== 'object') {
          console.warn('[PRS] cargarIndicadoresProveedor - invalid payload', payload, res);
        }

        const satisfaccionValue = this.parsePercentage(
          payload?.satisfaccion ??
          payload?.satisfaction ??
          payload?.satisfactionPercent ??
          payload?.satisfaction_percent ??
          payload?.satisfaction_percentage ??
          payload?.satisfactionScore ??
          payload?.scoreSatisfaction ??
          current?.satisfaccion ??
          current?.satisfaction ??
          null
        );

        const cumplimientoValue = this.parsePercentage(
          payload?.cumplimiento ??
          payload?.cumplimientoPorcentaje ??
          payload?.cumplimiento_porcentaje ??
          current?.cumplimiento ??
          null
        );

        const scoreGeneralValue = this.parseNumber(
          payload?.scoreGeneral ??
          payload?.scoringGeneral ??
          payload?.scoreFinal ??
          payload?.score_final ??
          payload?.score ??
          payload?.score_general ??
          payload?.score_total ??
          payload?.puntaje ??
          payload?.puntajeFinal ??
          current?.scoreFinal ??
          current?.score_final ??
          current?.score ??
          current?.scoreGeneral ??
          current?.scoringGeneral ??
          null
        );

        const likesValue = Number(
          this.parseNumber(
            payload?.likes ??
            payload?.likeCount ??
            payload?.likes_count ??
            payload?.totalLikes ??
            current?.likes ??
            0
          ) ?? 0
        );

        const dislikesValue = Number(
          this.parseNumber(
            payload?.dislikes ??
            payload?.dislikeCount ??
            payload?.dislikes_count ??
            payload?.totalDislikes ??
            current?.dislikes ??
            0
          ) ?? 0
        );

        const tiempoEntregaRaw =
          res?.tiempoEntregaPromedio ??
          res?.tiempo_entrega_promedio ??
          res?.tiempoEntregaDias ??
          res?.tiempo_entrega_dias ??
          current?.tiempoEntregaPromedio ??
          current?.tiempoEntregaDias ??
          null;

        const fechaRegistroRaw =
          res?.fechaRegistro ??
          res?.fecha_registro ??
          res?.createdAt ??
          res?.created_at ??
          current?.fechaRegistro ??
          null;

        const update = {
          ...current,
          pedidosCompletados:
            res?.pedidosCompletados ??
            res?.pedidos_completados ??
            current.pedidosCompletados ??
            0,
          pedidosTotal:
            res?.pedidosTotal ??
            res?.pedidos_total ??
            current.pedidosTotal ??
            0,
          cumplimiento: cumplimientoValue ?? current.cumplimiento ?? 0,
          scoreGeneral: scoreGeneralValue ?? current.scoreGeneral ?? 0,
          scoringGeneral: scoreGeneralValue ?? current.scoringGeneral ?? 0,
          scoreFinal: scoreGeneralValue ?? current.scoreFinal ?? current.scoreGeneral ?? current.scoringGeneral ?? 0,
          satisfaccion: satisfaccionValue ?? current?.satisfaccion ?? 0,
          satisfaction: satisfaccionValue ?? current?.satisfaction ?? current?.satisfaccion ?? 0,
          tiempoEntregaPromedio: tiempoEntregaRaw,
          tiempoEntregaDias:
            res?.tiempoEntregaDias ??
            res?.tiempo_entrega_dias ??
            current?.tiempoEntregaDias ??
            current?.tiempo_entrega_dias ??
            null,
          descripcion:
            payload?.descripcionProveedor ??
            payload?.descripcion_proveedor ??
            payload?.descripcion ??
            payload?.description ??
            payload?.detalle ??
            payload?.detalleProveedor ??
            payload?.detalle_proveedor ??
            payload?.descripcionBreve ??
            current?.descripcionProveedor ??
            current?.descripcion_proveedor ??
            current?.descripcion ??
            current?.description ??
            current?.detalle ??
            current?.detalleProveedor ??
            current?.detalle_proveedor ??
            current?.descripcionBreve ??
            null,
          fechaRegistro: fechaRegistroRaw,
          categoriaPrincipal:
            res?.categoriaPrincipal ??
            res?.categoria ??
            current.categoriaPrincipal ??
            current.categoria ??
            null,
          estado: res?.estado ?? current.estado ?? null,
          verificado: res?.verificado ?? current.verificado ?? false,
          likes: likesValue,
          dislikes: dislikesValue,
          totalResenas:
            res?.totalResenas ??
            res?.total_resenas ??
            current.totalResenas ??
            current.totalComentarios ??
            0
        };

        this.recalcularMetricasProveedor(update);

        if (index !== -1) {
          this.providers[index] = update;
        } else {
          console.warn('[PRS] cargarIndicadoresProveedor - provider index not found', feedback);
        }

        if (
          this.selectedProvider &&
          Number(this.selectedProvider.idProveedor ?? this.selectedProvider.id_proveedor ?? this.selectedProvider.id ?? this.selectedProvider.idProvider) === Number(idProveedor)
        ) {
          this.selectedProvider = {
            ...this.selectedProvider,
            ...update
          };
        }

        if (index !== -1) {
          this.providers = [...this.providers]; // 🔥 fuerza render
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }
  private setProviderList(providers: any[]): void {
    this.providers = (providers || []).map(provider =>
      this.normalizarProveedor(provider)
    );

    this.expandedProviderKey =
      this.providers.length
        ? this.getProviderKey(this.providers[0], 0)
        : null;
  }

  private getProvidersFromProduct(): any[] {
    const possibleLists = [
      this.product?.proveedores,
      this.product?.providers,
      this.product?.proveedoresAsociados,
      this.product?.proveedoresDisponibles
    ];

    const firstList = possibleLists.find(Array.isArray);

    return firstList ? [...firstList] : [];
  }

  private extractIndicatorPayload(response: any): any {
    if (response === null || response === undefined) {
      return response;
    }

    if (Array.isArray(response)) {
      return response.length === 1 ? this.extractIndicatorPayload(response[0]) : response;
    }

    if (typeof response !== 'object') {
      return response;
    }

    const payload = response.data ??
      response.indicadores ??
      response.indicador ??
      response.resultado ??
      response.provider ??
      response.proveedor ??
      response;

    if (payload && payload !== response && typeof payload === 'object') {
      const nested = payload.data ??
        payload.indicadores ??
        payload.indicador ??
        payload.resultado ??
        payload.provider ??
        payload.proveedor;

      if (nested && nested !== payload) {
        return this.extractIndicatorPayload(payload);
      }
    }

    return payload;
  }

  private extractCommentsPayload(response: any): any[] {
    if (!response) {
      return [];
    }

    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.comentarios)) {
      return response.comentarios;
    }

    if (Array.isArray(response.reviews)) {
      return response.reviews;
    }

    return [];
  }

  private filterProvidersForProduct(providers: any[]): any[] {
    const idProducto =
      this.idProductoActual ||
      this.product?.idProducto ||
      this.product?.id_producto;

    if (!idProducto) {
      return providers;
    }

    return providers.filter(provider => {
      const providerProductId =
        provider?.idProducto ||
        provider?.id_producto;

      if (providerProductId) {
        return Number(providerProductId) === Number(idProducto);
      }

      const items = provider?.items || provider?.productos;

      if (!Array.isArray(items) || items.length === 0) {
        return true;
      }

      return items.some((item: any) => {
        const itemId =
          item?.idProducto ||
          item?.id_producto;

        return Number(itemId) === Number(idProducto);
      });
    });
  }

  normalizarProveedor(item: any): any {
    return {
      ...item,

      idProvProd:
        item?.idProvProd ||
        item?.id_prov_prod ||
        item?.idProveedorProducto ||
        null,

      idProducto:
        item?.idProducto ||
        item?.id_producto ||
        this.idProductoActual ||
        this.product?.idProducto ||
        this.product?.id_producto ||
        null,

      idProveedor:
        item?.idProveedor ||
        item?.id_proveedor ||
        item?.idProvider ||
        item?.id ||
        null,

      proveedor:
        item?.proveedor ||
        item?.razonSocial ||
        item?.razon_social ||
        item?.nombreProveedor ||
        item?.nombre ||
        'Proveedor',

      razonSocial:
        item?.razonSocial ||
        item?.razon_social ||
        item?.proveedor ||
        item?.nombreProveedor ||
        item?.nombre ||
        'Proveedor',

      categoriaPrincipal:
        item?.categoriaPrincipal ||
        item?.categoria ||
        item?.rubro ||
        null,

      ubicacion:
        item?.ubicacion ||
        item?.direccion ||
        item?.ciudad ||
        null,

      descripcion:
        item?.descripcion ||
        item?.description ||
        null,

      estado:
        item?.estado ??
        item?.status ??
        'ACTIVO',

      verificado:
        item?.verificado ??
        false,

      precioUnitario:
        item?.precioUnitario ||
        item?.precio_unitario ||
        item?.precio ||
        null,

      stock:
        item?.stock ?? null,

      tiempoEntregaDias:
        item?.tiempoEntregaDias ||
        item?.tiempo_entrega_dias ||
        null,

      tiempoEntregaPromedio:
        item?.tiempoEntregaPromedio ??
        item?.tiempo_entrega_promedio ??
        item?.tiempoEntregaDias ??
        item?.tiempo_entrega_dias ??
        null,

      garantiaMeses:
        item?.garantiaMeses ||
        item?.garantia_meses ||
        null,

      pedidosCompletados:
        item?.pedidosCompletados ?? 0,

      pedidosTotal:
        item?.pedidosTotal ?? 0,

      cumplimiento:
        item?.cumplimiento ??
        item?.porcentajeCumplimiento ??
        item?.cumplimiento_entrega ??
        item?.cumplimientoPorcentaje ??
        item?.cumplimiento_porcentaje ??
        0,

      scoringGeneral:
        item?.scoringGeneral ??
        item?.scoreGeneral ??
        item?.scoreFinal ??
        item?.score_final ??
        0,

      scoreFinal:
        item?.scoreFinal ??
        item?.score_final ??
        item?.score ??
        item?.puntaje ??
        item?.puntajeFinal ??
        null,

      scoreGeneral:
        item?.scoreGeneral ??
        item?.scoringGeneral ??
        item?.scoreFinal ??
        item?.score_final ??
        item?.score ??
        item?.puntaje ??
        item?.puntajeFinal ??
        0,

      comentarios:
        Array.isArray(item?.comentarios)
          ? item.comentarios.map((c: any) => this.normalizarComentario(c))
          : Array.isArray(item?.reviews)
            ? item.reviews.map((c: any) => this.normalizarComentario(c))
            : [],

      likes:
        Number(item?.likes ?? 0),

      dislikes:
        Number(item?.dislikes ?? 0),

      

      totalComentarios:
        item?.totalComentarios ||
        item?.total_comentarios ||
        0
      ,

      fechaRegistro:
        item?.fechaRegistro ??
        item?.fecha_registro ??
        item?.createdAt ??
        item?.created_at ??
        null,

      satisfaccion: (() => {
        const raw = item?.satisfaccion ??
          item?.satisfaction ??
          item?.satisfactionPercent ??
          item?.satisfaction_percent ??
          item?.satisfaction_percentage ??
          item?.satisfactionScore ??
          item?.scoreSatisfaction ??
          null;

        if (raw === null || raw === undefined) return item?.satisfaccion ?? 0;
        const n = Number(raw);
        if (Number.isNaN(n)) return item?.satisfaccion ?? 0;
        return n <= 1 ? Math.round(n * 100) : Math.round(n);
      })()
    };
  }


  getProductImage(): string | null {
    if (this.productImageFailed) {
      return null;
    }

    const image = this.product?.imagenes?.[0];

    return image?.URL || image?.url || null;
  }

  markProductImageFailed(): void {
    this.productImageFailed = true;
  }

  verDetalleProveedor(provider: any): void {
    this.origin = 'PRODUCTO_PROVEEDORES';
    this.selectedProvider = this.normalizarProveedor(provider);
    this.providers = [this.selectedProvider];

    this.expandedProviderKey = this.getProviderKey(
      this.selectedProvider,
      0
    );

    this.loadingProviders = false;

    this.cargarIndicadoresProveedor(this.selectedProvider);
    this.cargarComentariosProveedor(this.selectedProvider);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.cdr.detectChanges();
  }

  getProviderKey(provider: any, index: number): string {
    return String(
      provider?.idProveedor ??
      provider?.id ??
      provider?.razonSocial ??
      index
    );
  }

  toggleProvider(provider: any, index: number): void {
    const key = this.getProviderKey(provider, index);

    this.expandedProviderKey =
      this.expandedProviderKey === key
        ? null
        : key;

    if (this.expandedProviderKey) {
      this.cargarComentariosProveedor(provider);
    }
  }

  isProviderExpanded(provider: any, index: number): boolean {
    return this.expandedProviderKey === this.getProviderKey(provider, index);
  }

  getProviderName(provider: any): string {
    return provider?.razonSocial ||
      provider?.nombreProveedor ||
      provider?.nombre ||
      'Proveedor';
  }

  getProviderCategory(provider: any): string | null {
    return provider?.categoriaPrincipal ||
      provider?.categoria ||
      provider?.rubro ||
      null;
  }

  getProviderStatus(provider: any): string | null {
    return provider?.estado || null;
  }

  getProviderLocation(provider: any): string | null {
    return provider?.ubicacion ||
      provider?.direccion ||
      provider?.ciudad ||
      null;
  }

  getProviderDescription(provider: any): string | null {
    return provider?.descripcion ||
      provider?.descripcionProveedor ||
      provider?.descripcion_proveedor ||
      provider?.description ||
      provider?.detalle ||
      provider?.detalleProveedor ||
      provider?.detalle_proveedor ||
      null;
  }

  getProviderSince(provider: any): string {
    return provider?.fechaRegistro
      ? this.formatFecha(provider.fechaRegistro)
      : 'No disponible';
  }

  getProviderDelivery(provider: any): number | null {
    return provider?.tiempoEntregaPromedio ??
      provider?.tiempoEntrega ??
      provider?.tiempoEntregaDias ??
      null;
  }

  getProviderResponse(provider: any): number | null {

  const value =
    provider?.tiempoRespuestaPromedio ??
    provider?.tiempoRespuesta ??
    provider?.tiempo_respuesta ??
    provider?.tiempoEntregaPromedio ??
    provider?.tiempoEntrega ??
    provider?.tiempoEntregaDias;

  return value != null
    ? Math.round(value * 100) / 100
    : null;
}

  getProviderResponseLabel(provider: any): string {
    const value = this.getProviderResponse(provider);

    if (value === null) {
      return 'No disponible';
    }

    return `${value} días`;
  }

  getProviderCompliance(provider: any): number | null {
    return provider?.cumplimiento ?? 0;
  }

  getProviderOnTime(provider: any): number | null {
    const raw = provider?.cumplimiento ?? provider?.cumplimientoPorcentaje ?? provider?.cumplimiento_porcentaje ?? 0;
    const value = this.parseNumber(raw);
    if (value === null) {
      return 0;
    }
    return value <= 1 ? Math.round(value * 100) : Math.round(value);
  }

  getCompletedOrders(provider: any): number | null {
    return provider?.pedidosCompletados ?? 0;
  }

  getProviderScore100(provider: any): number | null {
    const score =
      provider?.scoringGeneral ??
      provider?.scoreGeneral ??
      provider?.scoreFinal ??
      provider?.score_final ??
      provider?.score ??
      provider?.puntaje ??
      provider?.puntajeFinal ??
      null;

    if (score === null || score === undefined || score === '') {
      return null;
    }

    const parsed = Number(score);
    if (Number.isNaN(parsed)) {
      return null;
    }

    if (parsed <= 1) {
      return Math.round(parsed * 100);
    }

    return Math.round(parsed);
  }

  getProviderReputation(provider: any): number | null {
    return this.getProviderScore100(provider);
  }

  getReviews(provider: any): any[] {
    const reviews =
      provider?.comentarios ??
      provider?.reviews ??
      [];

    return Array.isArray(reviews) ? reviews : [];
  }

  getReviewCommentDraft(provider: any, index: number): string {
    return this.ensureReviewDraft(provider, index).comentario;
  }

  setReviewCommentDraft(provider: any, index: number, value: string): void {
    const draft = this.ensureReviewDraft(provider, index);
    draft.comentario = value;
    draft.error = '';
  }

  getReviewDraftError(provider: any, index: number): string {
    return this.ensureReviewDraft(provider, index).error;
  }

  canSubmitReview(provider: any, index: number): boolean {
    return this.ensureReviewDraft(provider, index)
      .comentario
      .trim()
      .length > 0;
  }

  agregarComentarioProveedor(provider: any, index: number): void {
  const draft = this.ensureReviewDraft(provider, index);
  const comentario = draft.comentario.trim();

  if (!comentario) {
    draft.error = 'Escribe un comentario';
    return;
  }

  const idProveedor =
    provider?.idProveedor ||
    provider?.id_proveedor ||
    provider?.idProvider ||
    provider?.id;

  const idProducto =
    this.idProductoActual ||
    this.product?.idProducto ||
    this.product?.id_producto ||
    provider?.idProducto ||
    provider?.id_producto;

  if (!idProveedor || !idProducto) {
    draft.error = 'No se encontró la relación proveedor-producto.';
    console.warn('Faltan datos para registrar comentario', {
      idProveedor,
      idProducto,
      provider,
      product: this.product
    });
    return;
  }

  const request = {
    idProv: idProveedor,
    idProd: idProducto,
    comentario
  };

  this.http.post<any>(
    `${this.API_BASE}/comentarios`,
    request,
    { headers: this.getHeaders() }
  ).subscribe({
    next: () => {
      draft.comentario = '';
      draft.error = '';

      this.cargarComentariosProveedor(provider, true);
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Comentario rechazado', err);
      const message = String(err?.error?.message ?? err?.error ?? '').toLowerCase();
      draft.error = message.includes('inapropiado')
        ? 'El comentario fue rechazado por moderacion.'
        : 'No se pudo registrar el comentario';
    }
  });
}

  getReviewCount(provider: any): number {
    return this.getReviews(provider).length;
  }

  getProviderTotalComments(provider: any): number {
    return this.getReviewCount(provider);
  }

  getProviderLikes(provider: any): number {
    return Number(provider?.likes ?? 0);
  }

  getProviderDislikes(provider: any): number {
    return Number(provider?.dislikes ?? 0);
  }

getReviewLikes(review: any): number {
  return Number(review?.likes ?? review?.likesCount ?? 0);
}

  getReviewDislikes(review: any): number {
  return Number(review?.dislikes ?? review?.dislikesCount ?? 0);
}
  getCommentLikes(comentario: any): number {
    return this.getReviewLikes(comentario);
  }

  getCommentDislikes(comentario: any): number {
    return this.getReviewDislikes(comentario);
  }

  hasUserReaction(
    comentario: any,
    tipo: 'LIKE' | 'DISLIKE'
  ): boolean {
    return comentario?.userReaction === tipo;
  }

  reactToComment(
    comentario: any,
    tipo: 'LIKE' | 'DISLIKE',
    provider?: any
  ): void {
    if (!comentario?.idComentario) {
      return;
    }

    const previousReaction = comentario?.userReaction ?? null;
    const previousLikes = this.getReviewLikes(comentario);
    const previousDislikes = this.getReviewDislikes(comentario);

    this.applyOptimisticReaction(comentario, tipo);

    const request = {
      idComentario: comentario.idComentario,
      tipo
    };

    this.http.post(
      `${this.API_BASE}/comentarios/reaccion`,
      request,
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        if (provider) {
          this.cargarComentariosProveedor(provider, true);
        } else {
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.rollbackOptimisticReaction(comentario, {
          previousReaction,
          previousLikes,
          previousDislikes
        });
        console.error('Error reaccionando comentario', err);
        Swal.fire({
          icon: 'error',
          title: 'No se pudo registrar la reacción',
          text: 'Se restauró el estado anterior.'
        });
        this.cdr.detectChanges();
      }
    });
  }

  private applyOptimisticReaction(comentario: any, tipo: 'LIKE' | 'DISLIKE'): void {
    const previousReaction = comentario?.userReaction ?? null;
    const likes = this.getReviewLikes(comentario);
    const dislikes = this.getReviewDislikes(comentario);

    comentario.userReaction = tipo;

    if (previousReaction === tipo) {
      return;
    }

    if (previousReaction === 'LIKE' && tipo === 'DISLIKE') {
      comentario.likes = Math.max(0, likes - 1);
      comentario.dislikes = dislikes + 1;
    } else if (previousReaction === 'DISLIKE' && tipo === 'LIKE') {
      comentario.dislikes = Math.max(0, dislikes - 1);
      comentario.likes = likes + 1;
    } else if (!previousReaction && tipo === 'LIKE') {
      comentario.likes = likes + 1;
    } else if (!previousReaction && tipo === 'DISLIKE') {
      comentario.dislikes = dislikes + 1;
    }

    comentario.likesCount = Number(comentario.likes ?? 0);
    comentario.dislikesCount = Number(comentario.dislikes ?? 0);
  }

  private rollbackOptimisticReaction(
    comentario: any,
    snapshot: { previousReaction: any; previousLikes: number; previousDislikes: number }
  ): void {
    comentario.userReaction = snapshot.previousReaction;
    comentario.likes = snapshot.previousLikes;
    comentario.dislikes = snapshot.previousDislikes;
    comentario.likesCount = snapshot.previousLikes;
    comentario.dislikesCount = snapshot.previousDislikes;
  }

  getTotalReactions(provider: any): number {
    return this.getProviderLikes(provider) + this.getProviderDislikes(provider);
  }

  getProviderSatisfaction(provider: any): number {
    const raw = provider?.satisfaccion ??
      provider?.satisfaction ??
      provider?.satisfactionPercent ??
      provider?.satisfaction_percent ??
      provider?.satisfaction_percentage ??
      provider?.satisfactionScore ??
      provider?.scoreSatisfaction ??
      0;
    const n = Number(raw ?? 0);
    if (Number.isNaN(n)) return 0;
    return n <= 1 ? Math.round(n * 100) : Math.round(n);
  }

  getReviewAuthor(review: any): string {
    return review?.usuario ||
      review?.autor ||
      `${review?.nombreUsuario || ''}`.trim() ||
      'Cliente';
  }

  getReviewComment(review: any): string {
    return review?.comentario || '';
  }

  getReviewDate(review: any): string {
    return review?.fecha || '';
  }

  getReviewReactionType(review: any): 'LIKE' | 'DISLIKE' | 'NEUTRAL' | '' {
    return review?.tipo || review?.type || review?.reactionType || review?.tipoReaccion || '';
  }

  getReviewReactionLabel(review: any): string {
    const tipo = this.getReviewReactionType(review);

    if (tipo === 'LIKE') return 'POSITIVO';
    if (tipo === 'DISLIKE') return 'NEGATIVO';
    if (tipo === 'NEUTRAL') return 'NEUTRO';

    return 'No disponible';
  }

  formatFecha(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '0%';
    }

    return `${Math.round(value)}%`;
  }

  private parseNumber(value: any): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    const normalized = String(value)
      .trim()
      .replace('%', '')
      .replace(',', '.')
      .replace(/\s+/g, '');

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parsePercentage(value: any): number | null {
    const parsed = this.parseNumber(value);
    if (parsed === null) {
      return null;
    }
    return parsed <= 1 ? Math.round(parsed * 100) : Math.round(parsed);
  }

  formatDays(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return 'No disponible';
    }

    return `${value} días`;
  }

  progressValue(value: number | null | undefined): number {
    if (value === null || value === undefined) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(Number(value))
      )
    );
  }

  private ensureReviewDraft(
    provider: any,
    index: number
  ): {
    comentario: string;
    error: string;
  } {
    const key = this.getReviewDraftKey(provider, index);

    if (!this.reviewDrafts[key]) {
      this.reviewDrafts[key] = {
        comentario: '',
        error: ''
      };
    }

    return this.reviewDrafts[key];
  }

  private getReviewDraftKey(provider: any, index: number): string {
    return this.getProviderKey(provider, index);
  }

  private getWritableReviews(provider: any): any[] {
    if (!Array.isArray(provider.comentarios)) {
      provider.comentarios = [];
    }

    return provider.comentarios;
  }

  get yaEnCarrito(): boolean {
    return this.requestItems.some(
      x => x.idProducto === this.product?.idProducto
    );
  }

  aumentarQty(): void {
    this.qty++;
  }

  disminuirQty(): void {
    if (this.qty > 1) {
      this.qty--;
    }
  }

  agregarAlCarrito(): void {
    if (!this.product) {
      return;
    }

    const existe = this.requestItems.find(
      x => x.idProducto === this.product.idProducto
    );

    if (!existe) {
      this.requestItems.push({
        idProducto: this.product.idProducto,
        name: this.product.producto,
        detail: `${this.product.marca}`,
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

  volverAlDetalle(): void {
    if (!this.product) {
      this.router.navigate(['/app/rfq/catalog']);
      return;
    }

    this.router.navigate(
      [
        '/app/rfq/product',
        this.product?.idProducto
      ],
      {
        state: {
          product: this.product
        }
      }
    );
  }
}
