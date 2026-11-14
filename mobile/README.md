# Nethink B2B Mobile

Aplicación móvil para la selección, comparación y abastecimiento de equipos de red de Nethink S.A.C., desarrollada con React Native, Expo y TypeScript.

## Tecnologías y Estructura

* Stack principal: React 19, React Native 0.81, Expo SDK 54, Expo Router, Axios (con interceptores JWT) y EAS Build.
* Funciones nativas: Almacenamiento seguro, geolocalización, mapas, selección de documentos, síntesis y reconocimiento de voz.
* Estructura clave:
  * `app/`: Pantallas y rutas organizadas por rol mediante Expo Router.
  * `components/`: Componentes UI reutilizables.
  * `services/`: Gestión de Axios y consumo de endpoints REST.
  * `app.json` / `eas.json`: Configuración de Expo, permisos y perfiles de compilación.

## Guía rápida de uso

1. Instalación y entorno:
   ```bash
   cd mobile
   cp .env.example .env  # Configurar EXPO_PUBLIC_API_URL
   npm install
   ```
   (Nota: Para dispositivos físicos en la misma red Wi-Fi, utiliza la IP LAN de tu equipo en lugar de `localhost`).

2. Ejecución local:
   ```bash
   npx expo start
   ```

3. Compilación APK (Android):
   ```bash
   npx eas-cli@latest build --platform android --profile preview
   ```

---

### Registro del commit

```bash
git config user.email "tu-correo-de-github@ejemplo.com"
git add mobile/README.md
git commit -m "docs(mobile): amplía guía de instalación, estructura y funcionalidades"
git push origin main
```
