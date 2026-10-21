use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelaireLegacyModelSummary {
    pub model_name: String,
    pub points_saisie: Vec<(String, String)>,
    pub diagnostics_by_script: Vec<String>,
    pub plans_count: usize,
    pub segments_count: usize,
}

/// Parses an XML analysis model from `C:\Program Files (x86)\Delaire Evolution\Modeles\`
/// (`Delaire_CF`, `Top 12`, `Analyse Frontale`).
pub fn parse_delaire_xml_model(path: &Path) -> Result<DelaireLegacyModelSummary, String> {
    let raw = fs::read_to_string(path).map_err(|e| format!("Error leyendo modelo XML: {}", e))?;
    let model_name = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("Delaire_XML")
        .to_string();

    let mut points_saisie = Vec::new();
    for chunk in raw.split("<Delaire_BO.ModeleAnalyse.PointSaisie").skip(1) {
        if let Some(end_idx) = chunk.find("</Delaire_BO.ModeleAnalyse.PointSaisie>") {
            let block = &chunk[..end_idx];
            let name = extract_tag_value(block, "Name").unwrap_or_default();
            let long_name = extract_tag_value(block, "LongName").unwrap_or_default();
            if !name.is_empty() && !points_saisie.iter().any(|(n, _)| n == &name) {
                points_saisie.push((name, long_name));
            }
        }
    }

    let mut diagnostics_by_script = Vec::new();
    for chunk in raw.split("<Delaire_BO.ModeleAnalyse.DiagnosticByScript").skip(1) {
        if let Some(end_idx) = chunk.find("</Delaire_BO.ModeleAnalyse.DiagnosticByScript>") {
            let block = &chunk[..end_idx];
            let name = extract_tag_value(block, "Name").unwrap_or_default();
            if !name.is_empty() && !diagnostics_by_script.contains(&name) {
                diagnostics_by_script.push(name);
            }
        }
    }

    let plans_count = raw.matches("<Delaire_BO.ModeleAnalyse.Plan").count();
    let segments_count = raw.matches("<Delaire_BO.ModeleAnalyse.Segment").count();

    Ok(DelaireLegacyModelSummary {
        model_name,
        points_saisie,
        diagnostics_by_script,
        plans_count,
        segments_count,
    })
}

fn extract_tag_value(xml_block: &str, tag: &str) -> Option<String> {
    let open = format!("<{}>", tag);
    let close = format!("</{}>", tag);
    let start = xml_block.find(&open)? + open.len();
    let end = xml_block[start..].find(&close)? + start;
    Some(xml_block[start..end].trim().to_string())
}
