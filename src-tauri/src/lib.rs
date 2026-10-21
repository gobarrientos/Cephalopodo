pub mod ai_landmarks;
pub mod analyses;
pub mod delaire_xml;
pub mod dicom_loader;
pub mod geometry;
pub mod landmarks;
pub mod llm_client;

use ai_landmarks::{detect_landmarks_automated, AiDetectionConfig};
use analyses::{compute_analysis, list_all_analyses_metadata, AnalysisResult};
use delaire_xml::{parse_delaire_xml_model, DelaireLegacyModelSummary};
use dicom_loader::{load_medical_image_from_path, LoadedMedicalImage, PatientDemographics};
use landmarks::{build_landmark_map, get_landmark_catalog, LandmarkDefinition, PlacedLandmark};
use llm_client::{interpret_analysis_with_ai, LlmInterpretationResponse, LlmRequestConfig};
use std::path::Path;

#[tauri::command]
pub fn get_catalog() -> Vec<LandmarkDefinition> {
    get_landmark_catalog()
}

#[tauri::command]
pub fn get_analyses_list() -> Vec<(String, String)> {
    list_all_analyses_metadata()
}

#[tauri::command]
pub fn load_medical_file(path: String) -> Result<LoadedMedicalImage, String> {
    load_medical_image_from_path(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn auto_detect_landmarks(config: AiDetectionConfig) -> Vec<PlacedLandmark> {
    detect_landmarks_automated(&config)
}

#[tauri::command]
pub fn run_cephalometric_analysis(
    analysis_id: String,
    landmarks: Vec<PlacedLandmark>,
    image_width: f64,
    image_height: f64,
    demographics: PatientDemographics,
) -> AnalysisResult {
    let map = build_landmark_map(&landmarks, image_width, image_height);
    compute_analysis(&analysis_id, &map, &demographics)
}

#[tauri::command]
pub fn run_all_cephalometric_analyses(
    landmarks: Vec<PlacedLandmark>,
    image_width: f64,
    image_height: f64,
    demographics: PatientDemographics,
) -> Vec<AnalysisResult> {
    let map = build_landmark_map(&landmarks, image_width, image_height);
    list_all_analyses_metadata()
        .into_iter()
        .map(|(id, _)| compute_analysis(&id, &map, &demographics))
        .collect()
}

#[tauri::command]
pub async fn request_llm_interpretation(
    llm_config: LlmRequestConfig,
    demographics: PatientDemographics,
    analysis: AnalysisResult,
) -> Result<LlmInterpretationResponse, String> {
    interpret_analysis_with_ai(&llm_config, &demographics, &analysis)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn inspect_legacy_delaire_model(path: String) -> Result<DelaireLegacyModelSummary, String> {
    parse_delaire_xml_model(Path::new(&path))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_catalog,
            get_analyses_list,
            load_medical_file,
            auto_detect_landmarks,
            run_cephalometric_analysis,
            run_all_cephalometric_analyses,
            request_llm_interpretation,
            inspect_legacy_delaire_model
        ])
        .run(tauri::generate_context!())
        .expect("Error al ejecutar la aplicación standalone Caphalopodo (Tauri v2)");
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::geometry::*;

    #[test]
    fn test_delaire_geometry_primitives() {
        let a = Point2D::new(0.0, 0.0);
        let b = Point2D::new(100.0, 0.0);
        let c = Point2D::new(0.0, 100.0);
        assert!((angle_3pts(b, a, c) - 90.0).abs() < 1e-6);
        assert!((distance_mm(a, b, 0.1) - 10.0).abs() < 1e-6);
    }

    #[test]
    fn test_all_17_analyses_compute_cleanly() {
        let demo = PatientDemographics::default();
        let placed = Vec::new();
        let results = run_all_cephalometric_analyses(placed, 1000.0, 1000.0, demo);
        assert_eq!(results.len(), 17);
        for r in results {
            assert!(!r.measurements.is_empty(), "Analysis {} had no measurements", r.id);
        }
    }
}
