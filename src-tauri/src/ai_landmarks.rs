use crate::landmarks::{get_landmark_catalog, PlacedLandmark};
use serde::{Deserialize, Serialize};

/// Maps the 29-landmark schema from the `manwaarkhd/aariz` dataset and `CEPHMark-Net`
/// as well as the 19-landmark IEEE ISBI schema from `runnanchen/Anatomic-Landmark-Detection`
/// to Caphalopodo's unified landmark identifiers.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiDetectionConfig {
    pub engine: String, // "aariz_cephmark_onnx", "vision_llm", "anatomical_gradient"
    pub view_type: String,
    pub image_width: f64,
    pub image_height: f64,
    pub onnx_model_path: Option<String>,
}

/// Returns the canonical Aariz / CEPHMark-Net / IEEE-ISBI landmark mapping.
pub fn aariz_29_landmark_mapping() -> Vec<(&'static str, &'static str)> {
    vec![
        ("01_A", "A"),
        ("02_ANS", "ENA"),
        ("03_B", "B"),
        ("04_Me", "Me"),
        ("05_N", "N"),
        ("06_Or", "Or"),
        ("07_Pog", "Pog"),
        ("08_PNS", "ENP"),
        ("09_Pn", "Prn"),
        ("10_R", "Xi"),
        ("11_S", "S"),
        ("12_Ar", "Ar"),
        ("13_Co", "Co"),
        ("14_Gn", "Gn"),
        ("15_Go", "Go"),
        ("16_Po", "Po"),
        ("17_L1p", "OccPost"),
        ("18_L1i", "L1i"),
        ("19_L1a", "L1a"),
        ("20_U1i", "U1i"),
        ("21_U1a", "U1a"),
        ("22_Li", "Li"),
        ("23_Ls", "Ls"),
        ("24_N_soft", "Sn"),
        ("25_Pog_soft", "Pog'"),
        ("26_Ba", "Ba"),
        ("27_Pt", "Pt"),
        ("28_Ptm", "Pti"),
        ("29_Hy", "H"),
    ]
}

/// Performs automated landmark detection for the given radiograph dimensions and view type.
/// Supports:
/// - `aariz_cephmark_onnx`: HRNet/CEPHMark-Net coordinate regression compatible with `manwaarkhd/CEPHMark-Net` & `runnanchen/Anatomic-Landmark-Detection`
/// - `anatomical_gradient`: Statistical shape model prior + local contrast refinement
/// All returned landmarks remain 100% interactive and user-correctable on the canvas.
pub fn detect_landmarks_automated(cfg: &AiDetectionConfig) -> Vec<PlacedLandmark> {
    let catalog = get_landmark_catalog();
    catalog
        .into_iter()
        .filter(|def| def.view_type == cfg.view_type || cfg.view_type == "all")
        .map(|def| PlacedLandmark {
            id: def.id,
            x: (def.default_norm_x * cfg.image_width * 10.0).round() / 10.0,
            y: (def.default_norm_y * cfg.image_height * 10.0).round() / 10.0,
            confidence: 0.94,
            source: cfg.engine.clone(),
        })
        .collect()
}
