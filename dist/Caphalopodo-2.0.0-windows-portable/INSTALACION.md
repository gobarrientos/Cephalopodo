# Caphalopodo — Instalación y uso por sistema operativo

> Aviso: herramienta de apoyo diagnóstico. Los resultados deben ser revisados por un profesional. Todo el procesamiento es local; las imágenes solo salen del equipo si usted configura una API key de ChatGPT, Claude o Gemini y pulsa "Generar informe con IA".

Hay dos tipos de paquete:

| Paquete | Requisitos | Qué incluye |
| --- | --- | --- |
| **Portable** (`Caphalopodo-<ver>-<so>-portable`) | Node.js 18+ (o Python 3 en macOS/Linux) y un navegador | Interfaz completa, 17 análisis, DICOM sin comprimir, IA por API |
| **Instalador nativo** (`.msi/.exe`, `.dmg`, `.deb/.AppImage`) | Ninguno | Aplicación Rust/Tauri con ventana propia. Se genera con GitHub Actions (ver abajo) |

## Windows

**Portable**
1. Instale Node.js LTS desde https://nodejs.org.
2. Descomprima `Caphalopodo-<ver>-windows-portable.zip`.
3. Doble clic en `Iniciar_Caphalopodo.bat`. Se abre el navegador en http://localhost:4173.
4. Para cerrar, cierre la ventana de consola.

**Instalador nativo**: ejecute el `.msi` o `-setup.exe`. Si SmartScreen avisa ("editor desconocido", el instalador no está firmado), elija *Más información → Ejecutar de todas formas*.

## macOS

**Portable**
1. Instale Node.js (https://nodejs.org o `brew install node`); Python 3 también sirve.
2. Descomprima: `tar -xzf Caphalopodo-<ver>-macos-portable.tar.gz`.
3. Ejecute: `cd Caphalopodo-*-macos-portable && chmod +x iniciar.command && ./iniciar.command`
   (o doble clic en `iniciar.command`; si Gatekeeper lo bloquea: clic derecho → Abrir).
4. Detenga con `Ctrl+C`.

**Instalador nativo**: abra el `.dmg` y arrastre la app a *Aplicaciones*. La app no está notarizada: la primera vez, clic derecho → Abrir, o `xattr -dr com.apple.quarantine /Applications/Caphalopodo.app`. Use `aarch64` para Apple Silicon y `x64` para Intel.

## Linux

**Portable**
1. Instale Node.js 18+ (`sudo apt install nodejs` / `dnf install nodejs`) o use Python 3.
2. `tar -xzf Caphalopodo-<ver>-linux-portable.tar.gz && cd Caphalopodo-*-linux-portable`
3. `sh iniciar.sh` → abre http://localhost:4173. Detenga con `Ctrl+C`.

**Instalador nativo**
- Debian/Ubuntu: `sudo apt install ./Caphalopodo_<ver>_amd64.deb` (requiere `libwebkit2gtk-4.1`).
- Cualquier distro: `chmod +x Caphalopodo_<ver>_amd64.AppImage && ./Caphalopodo_<ver>_amd64.AppImage`.

## Uso básico (todos los sistemas)

1. **Cargar imagen**: botón *Cargar DICOM / Imagen / PDF*, o elija una muestra. Los datos DICOM (nombre, apellido, edad, sexo, etnia, país, escala mm/px) se completan automáticamente y son editables.
2. **Puntos**: pulse *Auto-Trazado IA* y corrija arrastrando cualquier punto. Los análisis se recalculan en vivo.
3. **Análisis**: seleccione uno de los 17 en el panel derecho. Los valores de la tabla son editables y *Auto-Calcular* los restablece.
4. **Mediciones simples**: *Medir Distancia*, *Medir Ángulo*, y *Calibrar 10 mm* si la imagen no trae escala.
5. **Interpretación**: motor local por defecto; para ChatGPT/Claude/Gemini elija proveedor y pegue su API key (no se guarda en disco).
6. **Exportar**: *Exportar Informe* descarga un JSON con paciente, puntos y los 17 análisis.

## Limitaciones conocidas

- El **Auto-Trazado IA** actual coloca puntos con una plantilla anatómica media; **no ejecuta aún modelos entrenados** (CEPHMark-Net, Aariz, etc.). Revise y corrija siempre los puntos manualmente.
- **DICOM**: la versión web lee solo PixelData sin comprimir; la versión nativa usa `dicom-pixeldata`. **PDF**: se acepta el archivo pero no se renderiza todavía.
- Los rangos normativos son valores de literatura generales; el ajuste por etnia es mínimo.
- El código Rust (`src-tauri`) **aún no ha sido compilado ni probado** por el autor; el primer build en CI puede requerir correcciones.

## Generar los paquetes (desarrolladores)

- **Portables**: `node scripts/package-portable.mjs` → `dist/`.
- **Instaladores nativos**: suba el repo a GitHub y cree una etiqueta `git tag v2.0.0 && git push --tags`, o ejecute el workflow *release* manualmente. Los runners de Windows, macOS (ARM e Intel) y Ubuntu producen los instaladores como borrador de *Release*.
- **Local** (en cada SO, con Rust instalado): `npm install && node scripts/make-icon.mjs && npx tauri icon src-tauri/app-icon.png && npx tauri build`.
