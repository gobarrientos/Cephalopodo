# Caphalopodo — basado en Analisis de Delaire (Rust + Tauri v2 Standalone)

Reconstrucción modernizada y ampliada en **Rust (Tauri v2 Standalone + Motor Geométrico/DICOM/IA)** a partir de la ingeniería inversa estática.

## Características Principales

1. **Arquitectura en Rust Standalone (Tauri v2)**:
   - Código fuente nativo en `src-tauri/src/` (`geometry.rs`, `landmarks.rs`, `dicom_loader.rs`, `analyses.rs`, `ai_landmarks.rs`, `llm_client.rs`, `delaire_xml.rs`, `lib.rs`, `main.rs`).
2. **Soporte Multi-Formato e Imágenes Médicas**:
   - Carga **DICOM (`.dcm`, `.dicom`), JPEG, PNG, BMP y PDF**.
   - Extracción automática de metadatos DICOM: **Nombre, Apellido** (`0010,0010`), **Edad** (`0010,1010` / `0010,0030`), **Género/Sexo** (`0010,0040`), **Raza/Etnia** (`0010,2160`), **País** (`0010,2150`) y **Escala Física** (`0018,1164` / `0028,0030` `mm/px`).
3. **17 Análisis Cefalométricos Completos (con parámetros editables e interpretación clínica según literatura)**:
   1. **Björk-Jarabak**
   2. **Harvold-McNamara**
   3. **Ricketts (Completo)**
   4. **Ricketts Resumido**
   5. **Steiner**
   6. **Wits (Jacobson)**
   7. **Downs**
   8. **Tweed**
   9. **MSE (Expansión Esquelética Maxilar / Frontal PA)**
   10. **Olmos (Articular, Craneocervical y Oclusal)**
   11. **Riedel**
   12. **VAS (Análisis Simplificado)**
   13. **Di Paolo (Análisis del Cuadrilátero)**
   14. **Kim (ODI, APDI y Combination Factor)**
   15. **Hioides y VA (Posicionamiento Vertical/Anterior y Vía Aérea — SAHOS)**
   16. **Baccetti (Maduración Vertebral Cervical CVM CS1–CS6)**
   17. **Delaire Evolution (Análisis Arquitectural y Estructural Craneofacial C1–C4 / F1–F8)**
4. **Integración de Repositorios y Modelos de IA**:
   - Geometría y trazado inspirados en `alexcorvi/cephalometric` y `pieroantonio/CEPHOSS`.
   - Mapeo de detección anatómica guiada por IA compatible con `manwaarkhd/CEPHMark-Net`, `runnanchen/Anatomic-Landmark-Detection`, `um-lab/cepha-generation` y el dataset `manwaarkhd/aariz` (29 puntos + CVM).
   - Consultor Clínico IA bajo API de **OpenAI (ChatGPT)**, **Anthropic (Claude)** y **Google (Gemini)** + motor clínico local basado en literatura sin requerir conexión externa.

## Ejecución

- **Prueba inmediata de interfaz y verificación**:
  ```powershell
  npm test
  npm run start
  ```
- **Compilación del binario nativo Rust + Tauri v2**:
  ```powershell
  cd src-tauri
  cargo test
  cargo build --release
  ```
