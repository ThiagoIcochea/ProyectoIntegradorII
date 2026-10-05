# Nethink B2B Mobile

Aplicación móvil Expo/React Native que consume el mismo API REST del proyecto web Angular. No modifica `Frontend/` ni `Backend/`.

## Inicio

1. Copia `.env.example` a `.env` y ajusta `EXPO_PUBLIC_API_URL` si usarás una instancia local.
2. Ejecuta `npm install`.
3. Ejecuta `npx expo start`.

Para un teléfono físico, el API local debe usar la IP LAN de la máquina (por ejemplo `http://192.168.1.10:8081/api`), no `localhost`.

## Android Studio

Este proyecto ya incluye la carpeta nativa `android/`, generada con Expo Prebuild, para que Android Studio pueda abrirlo como proyecto Gradle.

1. Abre Android Studio y selecciona `mobile/android`.
2. En `Settings > Build, Execution, Deployment > Build Tools > Gradle`, usa el Gradle JDK embebido de Android Studio o JDK 21.
3. Si ejecutas Gradle desde terminal en Windows, evita el Java global 25 y usa el JDK de Android Studio:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
.\gradlew.bat assembleDebug
```

4. Para usar `npm` en PowerShell cuando la politica de ejecucion bloquee `npm.ps1`, ejecuta `npm.cmd`.
5. Para lanzar en emulador/dispositivo desde Expo usa `npm.cmd run android`. Para ejecutar desde Android Studio en modo debug, deja Metro activo con `npm.cmd start`.

## Incluido

- Sesión JWT en `expo-secure-store`, con encabezado `Authorization: Bearer TOKEN` centralizado por Axios.
- Inicio de sesión, registro cliente/proveedor y verificación MFA del contrato actual.
- Catálogo, solicitudes del cliente, solicitudes/pagos/entregas/reclamos/productos del proveedor y listas operativas de administración.
- Estados de carga, vacío, error, confirmación y diseño de tarjetas adaptado a móvil.

Expo nativo no requiere cambios CORS. Si se abre el destino web de Expo, se conserva la configuración CORS ya existente del backend y se debe agregar solamente el origen concreto que se utilice.
