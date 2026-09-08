# Nethink B2B Mobile

Aplicación móvil Expo/React Native que consume el mismo API REST del proyecto web Angular. No modifica `Frontend/` ni `Backend/`.

## Inicio

1. Copia `.env.example` a `.env` y ajusta `EXPO_PUBLIC_API_URL` si usarás una instancia local.
2. Ejecuta `npm install`.
3. Ejecuta `npx expo start`.

Para un teléfono físico, el API local debe usar la IP LAN de la máquina (por ejemplo `http://192.168.1.10:8081/api`), no `localhost`.

## Incluido

- Sesión JWT en `expo-secure-store`, con encabezado `Authorization: Bearer TOKEN` centralizado por Axios.
- Inicio de sesión, registro cliente/proveedor y verificación MFA del contrato actual.
- Catálogo, solicitudes del cliente, solicitudes/pagos/entregas/reclamos/productos del proveedor y listas operativas de administración.
- Estados de carga, vacío, error, confirmación y diseño de tarjetas adaptado a móvil.

Expo nativo no requiere cambios CORS. Si se abre el destino web de Expo, se conserva la configuración CORS ya existente del backend y se debe agregar solamente el origen concreto que se utilice.
