# CLAUDE.md

Guía para Claude Code al trabajar en este repositorio.

## Qué es

PWA de **consulta** de repuestos y casilleros para iPhone 13. Deriva de `app-agricola`
(carpeta hermana: `C:\Users\joser\Desktop\app-agricola`), pero es un proyecto independiente:
no importa nada de ella y tendrá su propio repo de git.

- **Solo lectura.** No edita stock ni sincroniza hacia atrás.
- **Datos locales.** Viven en IndexedDB del celular. El hosting (GitHub Pages, pendiente)
  sirve únicamente el código; **nunca** se publican datos de repuestos.
- **Sin App Store.** Se instala desde Safari con "Agregar a pantalla de inicio".

## Comandos

Plataforma: **Windows 10**. Node.js 24 en `C:\Program Files\nodejs` (puede no estar en el PATH).

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm install
npm run dev       # http://localhost:5173 y por LAN (vite --host)
npm run build     # → dist/
npm run preview   # sirve dist/ (aquí sí corre el service worker)
```

Iconos (stdlib pura, sin PIL):
```powershell
..\app-agricola\backend\.venv\Scripts\python.exe generar_iconos.py
```

## Flujo de datos

1. En `app-agricola`: `backend\.venv\Scripts\python.exe backend\scripts\exportar_repuestos.py`
   → `app-agricola\data\export\repuestos.json` (lee `data\repuestos.db` en modo solo lectura).
2. Se copia a Drive (`G:\Mi unidad\repuestos.json`) y se importa desde el iPhone con el botón
   **Importar / Actualizar** (selector de archivos de iOS).
3. La app valida que exista `items` (array) y guarda todo el JSON en IndexedDB.

### Formato de `repuestos.json`

```json
{ "generado": "YYYY-MM-DD HH:MM:SS",
  "items": [{ "c": codigo, "d": descripcion, "k": casillero, "s": stock_actual, "m": stock_minimo, "p": proveedor }] }
```

Claves cortas a propósito (tamaño). **No incluye precios** ni debe incluirlos sin decidirlo
explícitamente: el JSON viaja por Drive/mail. Si cambia el formato, actualizar a la vez
`exportar_repuestos.py` (en `app-agricola`) y `src/App.jsx`.

## Arquitectura

```
index.html              → meta tags iOS (standalone, safe-area, apple-touch-icon)
public/manifest.webmanifest, sw.js, icon-*.png, apple-touch-icon.png
src/main.jsx            → fuentes (@fontsource/figtree), registra sw.js solo en PROD
src/db.js               → IndexedDB: una clave 'inventario' con el JSON completo
src/App.jsx             → única pantalla: importar, buscador, filtros, lista
src/index.css           → estilos (paleta y tipografía copiadas de app-agricola)
```

- `vite.config.js` usa `base: './'` para funcionar en subruta de GitHub Pages
  (`usuario.github.io/<repo>/`). Mantener rutas **relativas** (`./sw.js`, `./manifest...`).
- `public/sw.js`: stale-while-revalidate del mismo origen, solo cachea el shell. Al cambiar
  la estrategia o querer forzar actualización, subir la constante `CACHE`.
- Búsqueda: tokens AND, sin mayúsculas ni acentos, sobre un índice precalculado con `useMemo`.
  Modos: Todo (código+descripción+casillero) / Código / Casillero. Render de a 60 (`PAGE`).
- El input de búsqueda usa `font-size: 16px` a propósito: menos de eso hace zoom automático en iOS.

## Estilo

Misma identidad que `app-agricola`: variables `--jd-green #367C2B`, `--jd-yellow #FFDE00`,
`--bg #EEECE6`, barra superior `#5E7853`, franja verde/amarilla fija arriba, fuente Figtree
(autoalojada vía `@fontsource` para que funcione offline). Si cambia el estilo allá, hay que
sincronizarlo a mano acá.

## Particularidades de iOS

- El service worker exige **HTTPS** (o localhost). `http://192.168.x.x` sirve para ver el
  diseño, no para instalar ni para el modo offline.
- Barra de estado: `apple-mobile-web-app-status-bar-style` es **`black`** (opaca; la app arranca
  debajo de la hora). Con `black-translucent` la PWA instalada difuminaba/lavaba la franja de
  degradé bajo la barra de estado (en Safari normal se veía bien); se probó una topbar sticky
  única sin éxito y se resolvió con `black`. El estilo se lee al instalar: tras cambiarlo hay que
  borrar la PWA de la pantalla de inicio y volver a agregarla.
- La topbar (`.topbar` en `index.css`) es un solo elemento sticky que incluye la franja
  verde/amarilla; no usar capas `position: fixed` aparte para eso.
- Safari puede borrar IndexedDB tras ~7 días sin uso **si la app no está instalada** en la
  pantalla de inicio. Instalada no ocurre. Por eso el JSON queda también en Drive como respaldo.
- `pedirPersistencia()` (`navigator.storage.persist`) se llama tras importar; es best-effort.

## Estado y pendientes

- Hecho: **v1 publicada** en https://joserossi.github.io/app-repuestos-movil/
  (repo público https://github.com/joserossi/app-repuestos-movil, rama `main` = código,
  rama `gh-pages` = build). UI: barra fija con logo + título a la derecha, buscador en
  mayúsculas, filtros Todo/Código/Casillero + pastilla Actualizar, lista tipo filas con
  el casillero a la derecha.
- Hecho: instalación en el iPhone probada (encabezado OK con barra de estado `black`).
  Ícono actual: cubo de "Repuestos" de app-agricola en crema `#EDE9DF` sobre verde de la barra
  `#5E7853` (generado por `generar_iconos.py`).
- Pendiente: posible actualización automática de datos.

## Deploy

```powershell
.\deploy.ps1      # build + publica dist/ en la rama gh-pages (tarda ~1 min en reflejarse)
```
Después de cambiar código: commitear/pushear `main` y correr `deploy.ps1`. Si cambia la
estrategia del service worker, subir `CACHE` en `public/sw.js` para forzar actualización
(hoy `repuestos-shell-v4`).

Particularidades de esta PC (por eso `deploy.ps1` y los push usan opciones especiales):
- HTTPS interceptado: git con OpenSSL falla con "unable to get local issuer certificate".
  Se usa `-c http.sslBackend=schannel` (certificados de Windows). **No** desactivar la
  verificación SSL. winget igual: usar `--source winget`.
- La credencial guardada de Visual Studio está vencida: se usa el token de `gh`
  (`-c credential.helper=!'C:/Program Files/GitHub CLI/gh.exe' auth git-credential`).
- `gh` está en `C:\Program Files\GitHub CLI\gh.exe` (puede no estar en el PATH). Su token
  no tiene scope `workflow`, así que no se pueden subir GitHub Actions; por eso se publica
  con la rama `gh-pages`.
- En PowerShell 5.1 git escribe avisos por stderr que parecen errores: mirar `$LASTEXITCODE`.
  Push de `main`:
  `git -c http.sslBackend=schannel -c credential.helper= -c "credential.helper=!'C:/Program Files/GitHub CLI/gh.exe' auth git-credential" push`
- Fuera de alcance por ahora: edición de stock, precios, otras secciones de la app general.
