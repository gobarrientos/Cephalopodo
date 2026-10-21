# Caphalopodo — Delaire Evolution NextGen (Rust + Tauri v2 Standalone)

Reconstrucción modernizada y ampliada en **Rust (Tauri v2 Standalone + Motor Geométrico/DICOM/IA)** a partir de la ingeniería inversa estática de **Delaire Evolution** (`C:\Program Files (x86)\Delaire Evolution`).

## Evidencia de Ingeniería Inversa (REA)

| Ensamblado Original | REA Evidence ID | SHA-256 | Rol Reconstruido en Rust |
| --- | --- | --- | --- |
| `Delaire.exe` | `ev_e3a0cef3348dfba077a8f608c360662f31592003985f48ac735ecd1942da66e1` | `5196f66acff9440beb6a1e0f4e8bf67eaa6d5b96fd407cb3d5be941c8592f2d0` | Interfaz gráfica, visor radiográfico, calibración de escala e informes (`src-tauri/src/lib.rs`, `src/app.js`) |
| `Delaire_BO.dll` | `ev_ee99aa4da3b641912e7068d4f736976cff35e5ac5035cdf81f6f7e352187b7e4` | `073437c08b72f21a6ccc2350c032b85ca44108c9a2e4d9cda6aee0910a366bbd` | Modelos de análisis, puntos anatómicos (`PointSaisie`), planos y diagnósticos (`src-tauri/src/landmarks.rs`, `src-tauri/src/analyses.rs`) |
| `Delaire_BL.dll` | `ev_388fc817556939da315cfc46d03a8058532e607e7ee3d4e709af34f6525e2955` | `f1ecf36a7c0559ac5d92c6e259600db31e1a8385cbd8d29ad2423fb40805707a` | `DICOMHelper`, `ModelesMgmt`, `EchelleMgmt`, serialización XML (`src-tauri/src/dicom_loader.rs`, `src-tauri/src/delaire_xml.rs`) |
| `Delaire_DAL.dll` | `ev_974add885e54f054fb678b6e5bade521612a27e11232426fa3690b52a5476812` | `80a7b963188058f970f36434f90bc47f22d8a977a8253f234f40a249a6b1ae22` | Persistencia y exportación de expedientes clínicos JSON |
| `FonctionsForScriptedElements.dll` | `ev_5c48fd427c85205a47886befb03aa9b2399f9e7b4b618034cf8104da95ede72a` | `d07a21f8a60f78113ecf9ebd90836fa0b3d74133eb35d07f2e2046789d2ff635` | Motor geométrico 2D (`Angle`, `DistanceEnPxl`, `FromMM`, `ToMM`, `Projection`, `IntersectionDePlan`, `IntersectionDeCercles`, `Homotethie`, `Parcourir`, `Symetrie`, `CentreDe` en `src-tauri/src/geometry.rs`) |

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
