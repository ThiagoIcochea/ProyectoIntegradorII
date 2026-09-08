# Auditoría responsive integral del frontend

Fecha de validación: 13 de julio de 2026.

## 1. Pantallas revisadas

Se inventariaron y comprobaron las 34 rutas disponibles, además de sus componentes compartidos y estados superpuestos.

- Públicas y autenticación: `/login`, `/forgot-password`, `/select-role`, `/register-client`, `/register-provider` y `/mfa`.
- Cliente: `/app/dashboard`, `/app/rfq/catalog`, `/app/rfq/product/:id`, `/app/rfq/provider-reviews`, `/app/rfq/results`, `/app/rfq/quotation`, `/app/rfq/payment`, `/app/requests`, `/app/requests/tracking/:id`, `/app/requests/evaluation/:id`, `/app/history` y `/app/profile`.
- Proveedor: `/app/provider/dashboard`, `/app/provider/requests`, `/app/provider/payments`, `/app/provider/claims`, `/app/provider/deliveries`, `/app/provider/products`, `/app/provider/api-settings` y `/app/provider/profile`.
- Administración: `/app/admin/dashboard`, `/app/admin/users`, `/app/admin/providers`, `/app/admin/rfqs`, `/app/admin/products`, `/app/admin/integrations`, `/app/admin/logs` y `/app/admin/settings`.
- Compartidos: layout principal, cabecera, menús laterales de los tres roles, selector de tema, asistente de voz y modal de planes.
- Estados adicionales: drawers de filtros y solicitud RFQ; modales legales, pago, guía API, ubicación, reclamo, gestión de producto, gestión de usuario, confirmación de pago y planes.

## 2. Problemas encontrados

- Las columnas promocionales de login, MFA y registro ocupaban demasiado espacio en pantallas estrechas y desplazaban el formulario principal.
- La cabecera del proveedor se comprimía y sus acciones competían por espacio en móvil.
- El menú lateral móvil podía quedar por debajo de la cabecera o de controles flotantes.
- Los filtros del historial se cortaban y sus botones perdían legibilidad en 320 px.
- Los accesos flotantes del carrito y la solicitud RFQ podían chocar con el asistente de voz; al abrirse, también competían con el drawer.
- El CTA final del carrito RFQ quedaba parcialmente recortado en 320 px.
- Había controles táctiles de 36 a 42 px en catálogo, reseñas de proveedores, detalle de producto, configuración API y otros flujos.
- Los modales de productos y usuarios de administración podían desbordarse o quedar detrás de otros elementos.
- El modal de confirmación de pagos del proveedor no tenía estilos compatibles con las clases usadas por su plantilla.
- Algunos modales largos no tenían una altura acotada con desplazamiento interno.
- Faltaban nombres accesibles y semántica de diálogo en varias acciones y modales modificados.

No se detectaron imágenes deformadas, textos truncados ni scroll horizontal global después de las correcciones.

## 3. Archivos modificados

- Globales y compartidos: `src/styles/base/_globals.scss`, `src/app/layout/main-layout/main-layout.html`, `src/app/layout/main-layout/main-layout.scss` y `src/app/shared/voice-assistant/voice-assistant.scss`.
- Autenticación: `src/app/features/auth/login/login.scss`, `src/app/features/auth/mfa/mfa.scss`, `src/app/features/auth/register-client/register-client.scss` y `src/app/features/auth/register-provider/register-provider.scss`.
- Cliente: `src/app/features/client/dashboard/dashboard.scss`, `src/app/features/client/history/history.scss`, `src/app/features/client/product-detail/product-detail.scss`, `src/app/features/client/provider-reviews/provider-reviews.scss`, `src/app/features/client/rfq-catalog/rfq-catalog.html`, `src/app/features/client/rfq-catalog/rfq-catalog.scss`, `src/app/features/client/rfq-results/rfq-results.scss` y `src/app/features/client/rfq-quotation/rfq-quotation.scss`.
- Proveedor: `src/app/features/provider/dashboard/dashboard.scss`, `src/app/features/provider/api-settings/api-settings.scss`, `src/app/features/provider/payments/payments.html` y `src/app/features/provider/payments/payments.scss`.
- Administración: `src/app/features/admin/products/products.html`, `src/app/features/admin/products/products.scss`, `src/app/features/admin/users/users.html` y `src/app/features/admin/users/users.scss`.
- QA: `scripts/responsive-audit.mjs`.

## 4. Mejoras realizadas por pantalla

### Autenticación y registro

- Se priorizó el formulario en móvil ocultando la columna promocional cuando el ancho ya no permite una composición de dos columnas.
- Se ajustaron alturas, paddings y distribución vertical en login, MFA y ambos registros.
- El código MFA pasa a una cuadrícula 3 × 2 en 320 px para conservar campos táctiles legibles.
- Botones de volver, reenvío, método, carga de certificado e información API tienen áreas táctiles adecuadas.

### Cliente

- Historial: filtros fluidos, botones completos y distribución en una columna en móviles pequeños.
- Dashboard: carrito RFQ con cierre accesible, desplazamiento interno, CTA visible y botón flotante oculto mientras el drawer está abierto.
- Catálogo: drawer de solicitud con cierre propio; FAB reubicado y oculto al abrir el panel; pestañas, cantidades y acciones táctiles ampliadas.
- Detalle y selección de proveedores: navegación, indicador del carrito, actualización y cantidades adaptadas a 44 px.
- Resultados y cotización: acciones de regreso ampliadas y modales conservados dentro del viewport.
- El asistente de voz ya no tapa drawers, modales ni acciones flotantes.

### Proveedor

- Cabecera compacta para móvil: estado API reducido a un indicador comprensible y plan visible sin forzar el ancho.
- Dashboard y configuración API: acciones principales con tamaño táctil consistente.
- Pagos: modal de confirmación reconstruido visualmente con ancho adaptable, scroll interno, acciones apilables y semántica accesible.

### Administración

- Productos: modal de gestión en una columna para móvil, altura limitada, contenido desplazable y footer de acciones estable.
- Usuarios: panel de gestión por encima de la cabecera, header estable, scroll interno y acciones apiladas.
- Las tablas y listados administrativos conservaron su estrategia de desbordamiento interno controlado, sin provocar scroll horizontal global.

## 5. Mejoras globales aplicadas

- Altura táctil mínima de 44 px para botones, inputs, selects y textareas en móvil.
- Jerarquía de capas coordinada entre cabecera, sidebars, overlays, drawers, modales y asistente de voz.
- Menús laterales móviles con desplazamiento vertical, `overscroll` contenido y acceso al cierre de sesión.
- Espacio inferior de seguridad en el contenido para evitar que los controles flotantes oculten información.
- Breakpoints y tamaños fluidos con `max-width`, porcentajes, `min()`, `calc()`, `dvh`, flexbox y grid, manteniendo colores, tipografía y estilo visual existentes.
- Roles de diálogo, títulos asociados, etiquetas accesibles y `type="button"` añadidos donde correspondía.

## 6. Resoluciones utilizadas para las pruebas

La matriz principal ejecutó 34 rutas en 8 anchos, para un total de 272 comprobaciones:

- 320 × 700 px.
- 375 × 812 px.
- 390 × 844 px.
- 430 × 932 px.
- 768 × 1024 px.
- 1024 × 768 px.
- 1366 × 768 px.
- 1920 × 1080 px.

También se probaron 16 estados abiertos en 320, 430 y 768 px: 48 comprobaciones adicionales de menús, drawers y modales. La automatización bloqueó las solicitudes al dominio del backend y usó datos locales aislados únicamente para alcanzar rutas que requieren estado de navegación.

Resultados finales verificados:

- Sin scroll horizontal global.
- Sin elementos fuera del viewport.
- Sin etiquetas cortadas.
- Sin modales desbordados.
- Sin imágenes deformadas.
- Sin objetivos táctiles menores al umbral establecido.
- `npm run build` completado correctamente.

## 7. Problemas que no pudieron corregirse y motivo

No queda un defecto responsive reproducible en los estados auditados.

La validación deliberadamente no cargó datos reales desde el backend. Por ello, combinaciones excepcionales de contenido que solo existan en producción —por ejemplo, textos o tablas con datos atípicamente largos— requieren una prueba integrada con datos controlados del equipo propietario del backend. Los estados vacíos, de carga y los datos locales de navegación sí fueron revisados.

El build mantiene advertencias preexistentes sobre la futura deprecación de `@import` en Sass y presupuestos de tamaño de algunos SCSS. No bloquean la compilación y su migración sería un refactor separado del objetivo responsive.

## 8. Confirmación de backend intacto

Esta auditoría no modificó ningún archivo dentro de `Backend/`, no cambió endpoints ni contratos, no ejecutó migraciones, no instaló dependencias de backend y no levantó ni compiló servicios del backend.

El repositorio ya mostraba archivos de backend modificados antes de iniciar esta auditoría; se conservaron exactamente fuera del alcance y no forman parte de estos cambios de frontend.
