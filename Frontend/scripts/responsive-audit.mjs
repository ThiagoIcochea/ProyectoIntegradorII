const CDP_ENDPOINT = process.env.CDP_ENDPOINT || 'http://127.0.0.1:9223';
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://127.0.0.1:4200';

import { mkdir, writeFile } from 'node:fs/promises';

const allViewports = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 }
];

const productFixture = {
  idProducto: 101,
  producto: 'Switch administrable empresarial de 48 puertos PoE+',
  name: 'Switch administrable empresarial de 48 puertos PoE+',
  marca: 'Nethink Networks',
  categoria: 'Switching empresarial',
  descripcion: 'Equipo de red para infraestructura corporativa con administracion centralizada y alta disponibilidad.',
  sku: 'NT-SW48-POE',
  qty: 3,
  precio: 2660,
  precioReferencia: 2660,
  tiempoEntregaDias: 5,
  garantiaMeses: 24,
  estado: 'Disponible',
  especificaciones: [
    { nombre: 'Puertos', valor: '48 x Gigabit PoE+' },
    { nombre: 'Uplinks', valor: '4 x SFP+' },
    { nombre: 'Capacidad', valor: '176 Gbps' },
    { nombre: 'Gestion', valor: 'Capa 3 administrable' }
  ],
  imagenes: []
};

const providerFixture = {
  idProveedor: 17,
  nombreProveedor: 'Proveedor Tecnologico Empresarial S.A.C.',
  scoreFinal: 0.97,
  totalCotizacion: 9416.4,
  tiempoEntregaPromedio: 5,
  items: [
    {
      idProducto: 101,
      nombreProducto: productFixture.producto,
      cantidad: 3,
      precioUnitario: 2660,
      precioBase: 2800,
      tipoDescuento: 'PRODUCTO',
      valorDescuento: 5,
      subtotal: 7980
    }
  ]
};

const allRoutes = [
  { path: '/login', area: 'public' },
  { path: '/forgot-password', area: 'public' },
  { path: '/select-role', area: 'public' },
  { path: '/register-client', area: 'public' },
  { path: '/register-provider', area: 'public' },
  { path: '/mfa', area: 'public', mfa: true },
  { path: '/app/dashboard', area: 'client', role: 'CLIENTE' },
  { path: '/app/rfq/catalog', area: 'client', role: 'CLIENTE' },
  { path: '/app/rfq/product/101', area: 'client', role: 'CLIENTE', historyState: { product: productFixture } },
  { path: '/app/rfq/provider-reviews', area: 'client', role: 'CLIENTE', historyState: { product: productFixture } },
  { path: '/app/rfq/results', area: 'client', role: 'CLIENTE', historyState: { proveedores: [providerFixture, { ...providerFixture, idProveedor: 18, nombreProveedor: 'Soluciones Integrales de Redes del Peru' }] } },
  { path: '/app/rfq/quotation', area: 'client', role: 'CLIENTE' },
  { path: '/app/rfq/payment', area: 'client', role: 'CLIENTE' },
  { path: '/app/requests', area: 'client', role: 'CLIENTE' },
  { path: '/app/requests/tracking/1', area: 'client', role: 'CLIENTE' },
  { path: '/app/requests/evaluation/1', area: 'client', role: 'CLIENTE' },
  { path: '/app/history', area: 'client', role: 'CLIENTE' },
  { path: '/app/profile', area: 'client', role: 'CLIENTE' },
  { path: '/app/provider/dashboard', area: 'provider', role: 'PROVEEDOR' },
  { path: '/app/provider/requests', area: 'provider', role: 'PROVEEDOR' },
  { path: '/app/provider/payments', area: 'provider', role: 'PROVEEDOR' },
  { path: '/app/provider/claims', area: 'provider', role: 'PROVEEDOR' },
  { path: '/app/provider/deliveries', area: 'provider', role: 'PROVEEDOR' },
  { path: '/app/provider/products', area: 'provider', role: 'PROVEEDOR' },
  { path: '/app/provider/api-settings', area: 'provider', role: 'PROVEEDOR' },
  { path: '/app/provider/profile', area: 'provider', role: 'PROVEEDOR' },
  { path: '/app/admin/dashboard', area: 'admin', role: 'ADMIN' },
  { path: '/app/admin/users', area: 'admin', role: 'ADMIN' },
  { path: '/app/admin/providers', area: 'admin', role: 'ADMIN' },
  { path: '/app/admin/rfqs', area: 'admin', role: 'ADMIN' },
  { path: '/app/admin/products', area: 'admin', role: 'ADMIN' },
  { path: '/app/admin/integrations', area: 'admin', role: 'ADMIN' },
  { path: '/app/admin/logs', area: 'admin', role: 'ADMIN' },
  { path: '/app/admin/settings', area: 'admin', role: 'ADMIN' }
];

const requestedWidths = (process.env.AUDIT_VIEWPORTS || '')
  .split(',')
  .map(value => Number(value.trim()))
  .filter(Boolean);
const requestedRoutes = (process.env.AUDIT_ROUTES || '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);
const viewports = requestedWidths.length
  ? allViewports.filter(viewport => requestedWidths.includes(viewport.width))
  : allViewports;
const routes = requestedRoutes.length
  ? allRoutes.filter(route => requestedRoutes.includes(route.path))
  : allRoutes;
const captureScreenshots = process.env.AUDIT_SCREENSHOTS === '1';
const auditModals = process.env.AUDIT_MODALS === '1';

const modalScenarios = [
  { name: 'client-sidebar', path: '/app/dashboard', role: 'CLIENTE', selector: 'app-main-layout', action: 'component.toggleMenuMovil()' },
  { name: 'provider-sidebar', path: '/app/provider/dashboard', role: 'PROVEEDOR', selector: 'app-main-layout', action: 'component.toggleMenuMovil()' },
  { name: 'admin-sidebar', path: '/app/admin/dashboard', role: 'ADMIN', selector: 'app-main-layout', action: 'component.toggleMenuMovil()' },
  { name: 'dashboard-rfq-drawer', path: '/app/dashboard', role: 'CLIENTE', selector: 'app-client-dashboard', action: 'component.mostrarCarritoMovil = true' },
  { name: 'catalog-filter-drawer', path: '/app/rfq/catalog', role: 'CLIENTE', selector: 'app-rfq-catalog', action: 'component.toggleFiltros()' },
  { name: 'catalog-request-drawer', path: '/app/rfq/catalog', role: 'CLIENTE', selector: 'app-rfq-catalog', action: 'component.mostrarSolicitudMovil = true' },
  { name: 'client-legal', path: '/register-client', selector: 'app-register-client', action: "component.openLegalModal('terms')" },
  { name: 'provider-payment-method', path: '/register-provider', selector: 'app-register-provider', action: 'component.openPagoModal()' },
  { name: 'provider-legal', path: '/register-provider', selector: 'app-register-provider', action: "component.openLegalModal('privacy')" },
  { name: 'provider-api-guide', path: '/register-provider', selector: 'app-register-provider', action: 'component.openApiGuideModal()' },
  { name: 'provider-plan', path: '/app/provider/dashboard', role: 'PROVEEDOR', selector: 'app-main-layout', action: 'component.abrirPlanesProveedor()' },
  { name: 'quotation-location', path: '/app/rfq/quotation', role: 'CLIENTE', selector: 'app-rfq-quotation', action: 'component.abrirMapaModal()' },
  { name: 'tracking-claim', path: '/app/requests/tracking/1', role: 'CLIENTE', selector: 'app-request-tracking', action: 'component.abrirReclamoDemora()' },
  { name: 'admin-product', path: '/app/admin/products', role: 'ADMIN', selector: 'app-admin-products', action: "component.selectedProduct = { id: 1, name: 'Switch empresarial de prueba', brand: 'Nethink', category: 'Switches', status: 'Activo', images: [] }; component.openManageModal()" },
  { name: 'admin-user', path: '/app/admin/users', role: 'ADMIN', selector: 'app-admin-users', action: "component.gestionar({ idUsuario: 1, nombreCompleto: 'Usuario de prueba responsive', correo: 'audit@nethink.local', estado: 'ACTIVO' })" },
  { name: 'provider-payment-confirmation', path: '/app/provider/payments', role: 'PROVEEDOR', selector: 'app-provider-payments', action: "component.selectedPayment = { idPago: 1, totalSolicitud: 2660, estado: 'PENDIENTE' }; component.abrirModal('APROBAR')" }
];

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });

    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
        return;
      }

      const handlers = this.listeners.get(message.method) || [];
      handlers.forEach(handler => handler(message.params));
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method, timeout = 8000) {
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        this.off(method, handler);
        resolve(false);
      }, timeout);
      const handler = params => {
        clearTimeout(timer);
        this.off(method, handler);
        resolve(params || true);
      };
      this.on(method, handler);
    });
  }

  on(method, handler) {
    const handlers = this.listeners.get(method) || [];
    handlers.push(handler);
    this.listeners.set(method, handlers);
  }

  off(method, handler) {
    this.listeners.set(method, (this.listeners.get(method) || []).filter(item => item !== handler));
  }

  close() {
    this.socket.close();
  }
}

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitForApp(client) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const result = await client.send('Runtime.evaluate', {
      expression: "document.readyState === 'complete' && !!document.querySelector('app-root')",
      returnByValue: true
    });
    if (result.result.value) {
      await delay(280);
      return;
    }
    await delay(100);
  }
}

async function navigate(client, route) {
  const url = `${APP_ORIGIN}${route.path}`;

  if (route.historyState) {
    const routed = await client.send('Runtime.evaluate', {
      expression: `(async () => {
        const shell = window.ng?.getComponent?.(document.querySelector('app-main-layout'));
        if (!shell?.router) return false;
        await shell.router.navigate([${JSON.stringify(route.path)}], { state: ${JSON.stringify(route.historyState)} });
        return true;
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    if (routed.result.value) {
      await delay(400);
      return;
    }
  }

  const loaded = client.once('Page.loadEventFired');
  await client.send('Page.navigate', { url });
  await loaded;
  await waitForApp(client);
}

async function seedBrowserState(client, role, needsMfa) {
  const flow = {
    email: 'responsive.audit@nethink.local',
    tempToken: 'audit-temp-token',
    purpose: 'LOGIN',
    emailOnly: false,
    resendInSeconds: 0,
    expiresInSeconds: 300,
    redirectTo: '/app/dashboard'
  };

  const expression = `(() => {
    localStorage.setItem('token', 'responsive-audit-token');
    localStorage.setItem('rol', ${JSON.stringify(role || 'CLIENTE')});
    localStorage.setItem('auth_user_email', 'responsive.audit@nethink.local');
    localStorage.setItem('auth_user_id', '1');
    localStorage.setItem('provider_current_plan', '3');
    localStorage.setItem('rfq_cart', ${JSON.stringify(JSON.stringify([productFixture]))});
    localStorage.setItem('selected_provider', ${JSON.stringify(JSON.stringify(providerFixture))});
    localStorage.setItem('current_solicitud_id', '1');
    sessionStorage.setItem('pending_mfa_flow', ${JSON.stringify(JSON.stringify(flow))});
    document.documentElement.dataset.auditMfa = ${JSON.stringify(needsMfa ? 'true' : 'false')};
  })()`;
  await client.send('Runtime.evaluate', { expression });
}

const auditExpression = `(() => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const root = document.documentElement;
  const body = document.body;
  const selectorFor = element => {
    if (element.id) return '#' + CSS.escape(element.id);
    const classes = [...element.classList].slice(0, 3).map(value => '.' + CSS.escape(value)).join('');
    return element.tagName.toLowerCase() + classes;
  };
  const isVisible = element => {
    let current = element;
    while (current) {
      const currentStyle = getComputedStyle(current);
      if (currentStyle.display === 'none' || currentStyle.visibility === 'hidden' || Number(currentStyle.opacity) === 0) return false;
      current = current.parentElement;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  const isOffCanvas = element => {
    const rect = element.getBoundingClientRect();
    if (rect.right <= 0 || rect.left >= viewportWidth || rect.bottom <= 0 || rect.top >= viewportHeight) return true;
    const closedSidebar = element.closest('.sidebar:not(.is-open)');
    return !!closedSidebar && closedSidebar.getBoundingClientRect().right <= 0;
  };
  const isHorizontallyOffCanvas = element => {
    const rect = element.getBoundingClientRect();
    if (rect.right <= 0 || rect.left >= viewportWidth) return true;
    const closedSidebar = element.closest('.sidebar:not(.is-open)');
    return !!closedSidebar && closedSidebar.getBoundingClientRect().right <= 0;
  };
  const hasControlledOverflowParent = element => {
    let parent = element.parentElement;
    while (parent && parent !== body) {
      const style = getComputedStyle(parent);
      if (/(auto|scroll|hidden|clip)/.test(style.overflowX) && parent.scrollWidth > parent.clientWidth + 1) return true;
      parent = parent.parentElement;
    }
    return false;
  };

  const outside = [];
  for (const element of document.querySelectorAll('body *')) {
    if (!isVisible(element) || isOffCanvas(element)) continue;
    const rect = element.getBoundingClientRect();
    const exceedsViewport = rect.left < -2 || rect.right > viewportWidth + 2 || rect.width > viewportWidth + 2;
    if (exceedsViewport && !hasControlledOverflowParent(element)) {
      outside.push({ selector: selectorFor(element), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) });
      if (outside.length >= 12) break;
    }
  }

  const smallTargets = [];
  for (const element of document.querySelectorAll('button, a[class*="btn"], a[class*="button"], input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea')) {
    if (viewportWidth > 768 || !isVisible(element) || isHorizontallyOffCanvas(element) || element.closest('.topbar__search')) continue;
    const rect = element.getBoundingClientRect();
    if (rect.width < 43.5 || rect.height < 43.5) {
      smallTargets.push({ selector: selectorFor(element), width: Math.round(rect.width), height: Math.round(rect.height) });
      if (smallTargets.length >= 12) break;
    }
  }

  const clippedLabels = [];
  for (const element of document.querySelectorAll('h1, h2, h3, label, button, .page-title, .section-title')) {
    if (!isVisible(element)) continue;
    const style = getComputedStyle(element);
    const clipped = element.scrollWidth > element.clientWidth + 2 || element.scrollHeight > element.clientHeight + 2;
    if (clipped && /(hidden|clip)/.test(style.overflow + style.overflowX + style.overflowY)) {
      clippedLabels.push(selectorFor(element));
      if (clippedLabels.length >= 12) break;
    }
  }

  const dialogs = [];
  let visibleDialogCount = 0;
  for (const element of document.querySelectorAll('[role="dialog"], dialog')) {
    if (!isVisible(element)) continue;
    visibleDialogCount++;
    const rect = element.getBoundingClientRect();
    if (rect.left < -1 || rect.right > viewportWidth + 1 || rect.top < -1 || rect.bottom > viewportHeight + 1) {
      dialogs.push({ selector: selectorFor(element), width: Math.round(rect.width), height: Math.round(rect.height) });
    }
  }

  const distortedImages = [];
  for (const image of document.images) {
    if (!isVisible(image) || !image.naturalWidth || !image.naturalHeight) continue;
    const rect = image.getBoundingClientRect();
    const naturalRatio = image.naturalWidth / image.naturalHeight;
    const renderedRatio = rect.width / rect.height;
    const objectFit = getComputedStyle(image).objectFit;
    if (Math.abs(naturalRatio - renderedRatio) / naturalRatio > 0.08 && !['cover', 'contain', 'scale-down'].includes(objectFit)) {
      distortedImages.push(selectorFor(image));
    }
  }

  return {
    finalPath: location.pathname,
    title: document.querySelector('h1')?.textContent?.trim() || document.querySelector('h2')?.textContent?.trim() || '',
    globalOverflow: root.scrollWidth > viewportWidth + 1 || body.scrollWidth > viewportWidth + 1,
    documentWidth: Math.max(root.scrollWidth, body.scrollWidth),
    outside,
    smallTargets,
    clippedLabels,
    dialogs,
    visibleDialogCount,
    distortedImages,
    bodyTextLength: body.innerText.trim().length
  };
})()`;

async function main() {
  const target = await fetch(`${CDP_ENDPOINT}/json/new?${encodeURIComponent(`${APP_ORIGIN}/login`)}`, { method: 'PUT' }).then(response => {
    if (!response.ok) throw new Error(`No se pudo crear una pestana CDP: ${response.status}`);
    return response.json();
  });

  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await Promise.all([
    client.send('Page.enable'),
    client.send('Runtime.enable'),
    client.send('Network.enable')
  ]);
  await client.send('Network.setBlockedURLs', {
    urls: [
      'https://proyectoinnovacion.onrender.com/*',
      'https://fonts.googleapis.com/*',
      'https://fonts.gstatic.com/*'
    ]
  });

  await waitForApp(client);
  const findings = [];
  const summary = { routes: routes.length, viewports: viewports.length, checks: 0, redirects: [], overflows: [], outside: [], smallTargets: [], clippedLabels: [], dialogs: [], distortedImages: [], emptyViews: [] };

  for (const viewport of viewports) {
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width <= 768
    });

    for (const route of routes) {
      await seedBrowserState(client, route.role, route.mfa);
      await navigate(client, route);
      const evaluated = await client.send('Runtime.evaluate', { expression: auditExpression, returnByValue: true });
      const result = evaluated.result.value;
      const record = { route: route.path, area: route.area, viewport: viewport.width, ...result };
      findings.push(record);
      summary.checks++;

      if (captureScreenshots) {
        const screenshot = await client.send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: false,
          fromSurface: true
        });
        await mkdir('audit-screenshots', { recursive: true });
        const safeRoute = route.path.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-');
        await writeFile(`audit-screenshots/${viewport.width}-${safeRoute}.png`, Buffer.from(screenshot.data, 'base64'));
      }

      if (result.finalPath !== route.path) summary.redirects.push({ route: route.path, viewport: viewport.width, finalPath: result.finalPath });
      if (result.globalOverflow) summary.overflows.push({ route: route.path, viewport: viewport.width, documentWidth: result.documentWidth });
      if (result.outside.length) summary.outside.push({ route: route.path, viewport: viewport.width, elements: result.outside });
      if (result.smallTargets.length) summary.smallTargets.push({ route: route.path, viewport: viewport.width, elements: result.smallTargets });
      if (result.clippedLabels.length) summary.clippedLabels.push({ route: route.path, viewport: viewport.width, elements: result.clippedLabels });
      if (result.dialogs.length) summary.dialogs.push({ route: route.path, viewport: viewport.width, elements: result.dialogs });
      if (result.distortedImages.length) summary.distortedImages.push({ route: route.path, viewport: viewport.width, elements: result.distortedImages });
      if (result.bodyTextLength < 20) summary.emptyViews.push({ route: route.path, viewport: viewport.width, finalPath: result.finalPath });
    }
  }

  const modalChecks = [];
  if (auditModals) {
    for (const viewport of viewports) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.width <= 768
      });

      for (const scenario of modalScenarios) {
        await seedBrowserState(client, scenario.role, false);
        await navigate(client, { path: scenario.path });
        const opened = await client.send('Runtime.evaluate', {
          expression: `(() => {
            const element = document.querySelector(${JSON.stringify(scenario.selector)});
            const component = window.ng?.getComponent?.(element);
            if (!component) return false;
            ${scenario.action};
            window.ng?.applyChanges?.(component);
            return true;
          })()`,
          returnByValue: true
        });
        await delay(350);
        const evaluated = await client.send('Runtime.evaluate', { expression: auditExpression, returnByValue: true });
        const result = evaluated.result.value;
        modalChecks.push({
          scenario: scenario.name,
          viewport: viewport.width,
          opened: !!opened.result.value,
          visibleDialogCount: result.visibleDialogCount,
          globalOverflow: result.globalOverflow,
          outside: result.outside,
          overflowingDialogs: result.dialogs
        });

        if (captureScreenshots) {
          const screenshot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
          await mkdir('audit-screenshots', { recursive: true });
          await writeFile(`audit-screenshots/modal-${viewport.width}-${scenario.name}.png`, Buffer.from(screenshot.data, 'base64'));
        }
      }
    }
  }

  const compactElements = entries => {
    const grouped = new Map();
    for (const entry of entries) {
      const current = grouped.get(entry.route) || { route: entry.route, viewports: new Set(), elements: new Map() };
      current.viewports.add(entry.viewport);
      for (const element of entry.elements || []) {
        const key = typeof element === 'string' ? element : JSON.stringify(element);
        current.elements.set(key, element);
      }
      grouped.set(entry.route, current);
    }
    return [...grouped.values()].map(entry => ({
      route: entry.route,
      viewports: [...entry.viewports],
      elements: [...entry.elements.values()].slice(0, 16)
    }));
  };

  const compactSimple = (entries, valueKey) => {
    const grouped = new Map();
    for (const entry of entries) {
      const key = `${entry.route}|${entry[valueKey] || ''}`;
      const current = grouped.get(key) || { route: entry.route, viewports: [], [valueKey]: entry[valueKey] };
      current.viewports.push(entry.viewport);
      grouped.set(key, current);
    }
    return [...grouped.values()];
  };

  const report = {
    routes: summary.routes,
    viewports: viewports.map(viewport => viewport.width),
    checks: summary.checks,
    issueCounts: {
      redirects: summary.redirects.length,
      globalOverflows: summary.overflows.length,
      outsideViewport: summary.outside.length,
      smallTouchTargets: summary.smallTargets.length,
      clippedLabels: summary.clippedLabels.length,
      overflowingDialogs: summary.dialogs.length,
      distortedImages: summary.distortedImages.length,
      emptyViews: summary.emptyViews.length
    },
    redirects: compactSimple(summary.redirects, 'finalPath'),
    globalOverflows: compactSimple(summary.overflows, 'documentWidth'),
    outsideViewport: compactElements(summary.outside),
    smallTouchTargets: compactElements(summary.smallTargets),
    clippedLabels: compactElements(summary.clippedLabels),
    overflowingDialogs: compactElements(summary.dialogs),
    distortedImages: compactElements(summary.distortedImages),
    emptyViews: compactSimple(summary.emptyViews, 'finalPath'),
    modalChecks
  };

  client.close();
  console.log(JSON.stringify(report, null, 2));
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
