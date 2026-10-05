# Nethink B2B

Sistema de recomendación para la selección y abastecimiento de equipos de red de proveedores nacionales para **Nethink S.A.C.**

Proyecto académico de la Universidad Tecnológica del Perú, desarrollado para el curso **Curso Integrador II: Software**, Lima, 2026. La solución reúne información de productos y proveedores para facilitar la búsqueda, comparación, cotización y seguimiento de compras empresariales desde una aplicación móvil.

## ¿Qué problema resuelve?

La compra de equipos de red requiere consultar distintos catálogos, confirmar existencias y solicitar precios a varios proveedores. La información dispersa o desactualizada dificulta comparar alternativas y prolonga las decisiones de abastecimiento.

Nethink B2B centraliza esa información y ayuda al comprador a elegir considerando el costo, la disponibilidad, los tiempos de entrega y la reputación del proveedor. La calidad de las recomendaciones depende de los datos registrados y de la actualización de los inventarios.

## Roles del sistema

| Rol | Función | Acciones principales |
| --- | --- | --- |
| Cliente | Personal de compras o abastecimiento de la empresa compradora. | Buscar equipos, indicar cantidades, comparar alternativas, consultar recomendaciones, solicitar cotizaciones, adjuntar comprobantes de pago, seguir pedidos y evaluar proveedores. |
| Proveedor | Empresa nacional que ofrece equipos de red. | Mantener productos, precios, stock, descuentos y tiempos de entrega; atender cotizaciones, validar comprobantes, gestionar despachos y atender reclamos. |
| Administrador | Responsable de supervisar la plataforma. | Administrar usuarios, proveedores y productos; revisar información, configuraciones y registros del sistema, y supervisar las operaciones. |

La autenticación y la autorización por roles determinan las funciones disponibles para cada usuario.

## ¿Cómo funciona?

1. **Publicación del catálogo.** Los proveedores registran sus equipos y actualizan precios, disponibilidad, descuentos por volumen y condiciones de entrega.
2. **Definición del requerimiento.** El cliente busca productos y prepara una lista con los artículos y cantidades que necesita.
3. **Comparación de alternativas.** El backend consulta las ofertas, verifica la cobertura del requerimiento y calcula los importes con los descuentos aplicables.
4. **Recomendación.** El sistema asigna puntajes a las alternativas y presenta un ranking para apoyar la elección del cliente.
5. **Cotización.** El cliente solicita una cotización al proveedor seleccionado, quien revisa y gestiona la solicitud.
6. **Registro del pago.** El cliente realiza el pago externamente y adjunta el comprobante con los datos de la operación. El proveedor valida el abono.
7. **Preparación y entrega.** El proveedor actualiza el avance del pedido. El flujo contempla un código de recepción para validar la entrega.
8. **Evaluación.** El cliente registra su valoración y comentario; esa información alimenta la reputación del proveedor y las futuras recomendaciones.

El historial de solicitudes permite consultar el avance de la operación. El sistema también incluye gestión de reclamos y notificaciones por correo.

## Recomendaciones y análisis de comentarios

El motor de scoring se ejecuta en el backend. En la comparación de solicitudes de cotización —RFQ, por *Request for Quotation*— combina precio, tiempo de entrega y una valoración del proveedor. La ponderación cambia según la prioridad seleccionada: precio, tiempo, calidad o un criterio balanceado.

La valoración del proveedor incorpora información de evaluaciones, comentarios e historial operativo. Además, el servicio de moderación analiza los textos y clasifica su sentimiento como positivo, negativo o neutro. La IA aporta información sobre los comentarios; el ordenamiento de las alternativas se calcula mediante reglas de scoring en Java.

La implementación actual de moderación utiliza **Groq** con el modelo configurado en el código `openai/gpt-oss-20b`. El documento académico menciona **Grok**; esta documentación utiliza el nombre de la integración que aparece en el repositorio.

## Tecnologías

Las versiones corresponden a los archivos de configuración del repositorio.

| Componente | Tecnologías | Uso |
| --- | --- | --- |
| Aplicación móvil | React 19.1, React Native 0.81.5, Expo SDK 54, TypeScript 5.9, Expo Router | Pantallas y navegación para clientes, proveedores y administradores. |
| Comunicación móvil | Axios | Consumo de la API REST. |
| Funciones del dispositivo | Expo Secure Store, Expo Location, React Native Maps, Expo Document Picker, Expo Speech y Speech Recognition | Sesión local, ubicación de entrega, mapas, comprobantes y asistencia por voz. |
| Aplicación web | Angular 21.2, TypeScript, RxJS, SCSS, Leaflet y SweetAlert2 | Interfaz web y módulos operativos existentes. |
| Backend | Java 21, Spring Boot 3.5.14, Maven | API REST y reglas de negocio. |
| Seguridad | Spring Security y JWT | Autenticación y control de acceso. |
| Persistencia | Spring Data JPA / Hibernate y MySQL | Datos de usuarios, catálogo, solicitudes y operaciones. |
| IA | API de Groq | Moderación y clasificación de comentarios. |
| Servicios externos | Cloudinary, Resend y consulta de RUC mediante Decolecta | Archivos, correos y consulta de información empresarial. |
| Despliegue | Docker, Render y Aiven Cloud | Contenedor del backend y arquitectura cloud descrita en el documento. |
| Distribución Android | EAS Build | Compilación del APK con el perfil `preview`. |
| Verificación | Spring Boot Test, Spring Security Test, H2, Vitest y TypeScript | Herramientas de prueba y comprobación presentes en el proyecto. |

## Arquitectura general

La aplicación móvil y la aplicación web consumen una **API REST compartida**. El backend valida los accesos, procesa las reglas de negocio y consulta o actualiza la base de datos MySQL. También coordina los servicios externos de archivos, correo e inteligencia artificial.

El documento plantea Render para el despliegue web y del backend, y Aiven Cloud para MySQL. Esta descripción de infraestructura no constituye una comprobación de disponibilidad de los servicios desplegados.

## Estructura del repositorio

```text
ProyectoIntegradorII/
├── Backend/
│   └── b2b/                  # API REST en Spring Boot, Maven y Dockerfile
│       └── src/main/
│           ├── java/         # Controladores, servicios, entidades y repositorios
│           └── resources/    # Configuración y esquema SQL
├── Frontend/                 # Aplicación web Angular
├── mobile/                   # Aplicación React Native y Expo
│   ├── app/                  # Rutas y pantallas
│   ├── components/           # Componentes compartidos
│   ├── services/             # Comunicación con el backend
│   ├── app.json              # Configuración de Expo
│   └── eas.json              # Perfiles de compilación Android
├── README.md
└── RESUMEN_GITHUB.md          # Descripción breve y texto para presentar el proyecto
```

## Alcance y estado del proyecto

El documento académico prioriza la aplicación móvil y describe una web complementaria informativa. El repositorio conserva también módulos operativos en Angular, además de la aplicación móvil que consume el mismo backend.

El flujo principal de compra contempla **pagos externos con registro y validación de comprobantes**. El código incluye una integración PayPal asociada a suscripciones de proveedores; es una función adicional al flujo de abastecimiento descrito en el documento.

El sistema registra inventarios y seguimiento de entregas, pero la custodia de equipos, el transporte y la ejecución de transferencias corresponden a las empresas participantes. La existencia de módulos en el repositorio no implica que todos sus flujos hayan sido validados en producción. Las matrices de pruebas del documento contienen resultados pendientes.

## Aplicación móvil y APK

La guía de inicio móvil se encuentra en [mobile/README.md](mobile/README.md). La URL del backend se define mediante `EXPO_PUBLIC_API_URL`; el perfil `preview` de [mobile/eas.json](mobile/eas.json) incorpora la configuración para generar un APK.

Desde la carpeta `mobile`, con las dependencias instaladas y una sesión de EAS autorizada para el proyecto:

```powershell
npx.cmd eas-cli@latest build --platform android --profile preview
```

El APK se descarga desde el enlace de la compilación una vez que esta termina correctamente. Para el mapa de Android se requiere la configuración de Google Maps correspondiente. El uso de los servicios del sistema requiere acceso al backend.

## Equipo y metodología

El documento establece un desarrollo con **Scrum**, organizado en cuatro sprints durante 17 semanas, con planificación, seguimiento, revisión y retrospectiva.

| Integrante | Responsabilidad en el equipo |
| --- | --- |
| Carlos Enrique Giussepe Gonzales Aguilar | Product Owner |
| Thiago Paolo Icochea Rodriguez | Technical Lead y desarrollador |
| Andre Cesar Valdivia Penas | Scrum Master |
| Antonio Nicolás Guevara Morales | Desarrollador |

**Docente:** Genns Eduardo Yataco Silva.

## Referencias de esta documentación

- Documento académico **Proyecto Integrador II.pdf**: objetivo y arquitectura, páginas 8–12; procesos y alcance, páginas 13–19; equipo y roles, páginas 20–23; metodología, páginas 34–36. Numeración de páginas del PDF.
- Configuración del código: [backend](Backend/b2b/pom.xml), [web](Frontend/package.json) y [móvil](mobile/package.json).
- Lógica principal: [RFQService](Backend/b2b/src/main/java/com/nethink/b2b/service/RFQService.java), [ScoringService](Backend/b2b/src/main/java/com/nethink/b2b/service/ScoringService.java) y [ModeracionService](Backend/b2b/src/main/java/com/nethink/b2b/service/ModeracionService.java).

El PDF fue proporcionado para elaborar esta documentación y no se incluye en el repositorio mediante este cambio.
