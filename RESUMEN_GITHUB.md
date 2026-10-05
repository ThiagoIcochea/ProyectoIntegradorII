# Resumen para GitHub — Nethink B2B

## Descripción breve del repositorio

Plataforma B2B para Nethink S.A.C. que centraliza equipos de red de proveedores nacionales, compara ofertas y recomienda alternativas de abastecimiento. Desarrollada con React Native/Expo, Angular, Spring Boot y MySQL.

## Presentación general

**Nethink B2B** es un proyecto académico de la Universidad Tecnológica del Perú que busca facilitar la selección y el abastecimiento de equipos de red para Nethink S.A.C. Centraliza productos, precios, disponibilidad y condiciones de entrega para reducir la búsqueda manual y apoyar la comparación de proveedores nacionales.

La solución cuenta con tres roles:

- **Cliente:** consulta productos, define cantidades, compara recomendaciones, solicita cotizaciones, registra comprobantes de pago y evalúa a los proveedores.
- **Proveedor:** administra su catálogo, stock, precios y descuentos; atiende cotizaciones, valida pagos y gestiona entregas y reclamos.
- **Administrador:** supervisa usuarios, proveedores, productos, configuraciones y operaciones de la plataforma.

El proceso comienza cuando el cliente prepara su requerimiento. El backend calcula alternativas y descuentos, y genera un ranking mediante scoring de precio, tiempo y valoración del proveedor. Después de seleccionar una oferta, se gestiona la cotización, el comprobante de un pago externo, el despacho y la confirmación de entrega. Las evaluaciones y los comentarios contribuyen a futuras recomendaciones.

La aplicación móvil utiliza **React Native, Expo y TypeScript**; la web existente utiliza **Angular**. Ambas consumen una **API REST con Java 21 y Spring Boot**, respaldada por **MySQL**. La solución incorpora **Spring Security y JWT**, análisis de comentarios mediante **Groq**, archivos en **Cloudinary** y correos mediante **Resend**. El documento define una infraestructura con **Docker, Render y Aiven Cloud**, y el proyecto móvil configura **EAS Build** para generar el APK de Android.

El equipo trabaja con Scrum: Carlos Enrique Giussepe Gonzales Aguilar como Product Owner, Thiago Paolo Icochea Rodriguez como Technical Lead y desarrollador, Andre Cesar Valdivia Penas como Scrum Master y Antonio Nicolás Guevara Morales como desarrollador.

## Texto para la modificación de documentación

**Título sugerido:**

```text
docs: documentar Nethink B2B, sus roles, tecnologías y flujo de abastecimiento
```

**Descripción sugerida:**

Se agrega un README general y un resumen de presentación para GitHub a partir del documento académico y del código actual. Se explican el problema que aborda Nethink B2B, los roles de cliente, proveedor y administrador, las tecnologías, la arquitectura compartida y el proceso desde la búsqueda hasta la evaluación posterior a la entrega.

La documentación distingue la aplicación web existente del enfoque móvil del documento, identifica Groq como la integración de IA del código y separa el registro de pagos externos de la integración adicional de PayPal para suscripciones. Incluye la estructura del repositorio, el equipo Scrum y el comando de generación del APK.

Validación: revisión del PDF y contraste con los manifiestos y servicios del repositorio; comprobación de enlaces locales. Este cambio solo agrega documentación y no acredita nuevas pruebas funcionales ni un despliegue.
