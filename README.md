# app-repuestos-movil

PWA de consulta de repuestos y casilleros para iPhone. Deriva de `app-agricola`.
Solo lectura. Los datos viven en el celular (IndexedDB); el hosting solo sirve el código.

## Actualizar los datos
1. En la PC (desde `app-agricola`):
   `backend\.venv\Scripts\python.exe backend\scripts\exportar_repuestos.py`
   → genera `data\export\repuestos.json` (sin precios).
2. Pasalo al iPhone (Drive, iCloud, AirDrop o mail).
3. En la app: **Importar** / **Actualizar** y elegí el archivo.

## Desarrollo
```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm install
npm run dev      # http://localhost:5173 (también accesible desde la LAN)
npm run build    # → dist/
```
El service worker solo se registra en el build de producción.

## Instalar en el iPhone
Abrir la URL en Safari → Compartir → **Agregar a pantalla de inicio**. Instalada, iOS no
borra los datos locales por inactividad. Conviene dejar el JSON en Drive como respaldo.

Los iconos se regeneran con `python generar_iconos.py`.
