use crate::analyses::AnalysisResult;
use crate::dicom_loader::PatientDemographics;
use anyhow::{anyhow, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmRequestConfig {
    pub provider: String, // "openai" | "anthropic" | "gemini" | "offline"
    pub api_key: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmInterpretationResponse {
    pub provider_used: String,
    pub model_used: String,
    pub clinical_synthesis: String,
    pub differential_diagnosis: Vec<String>,
    pub treatment_recommendations: Vec<String>,
    pub literature_citations: Vec<String>,
}

pub fn build_clinical_prompt(
    demo: &PatientDemographics,
    analysis: &AnalysisResult,
) -> String {
    let mut metrics_txt = String::new();
    for m in &analysis.measurements {
        metrics_txt.push_str(&format!(
            "- {} ({}): {:.2} {} [Norma: {:.1} a {:.1}, Media: {:.1}] -> Estado: {} ({})\n",
            m.label, m.code, m.value, m.unit, m.norm_min, m.norm_max, m.norm_mean, m.status, m.interpretation
        ));
    }

    format!(
        "Actúa como un especialista senior en Ortodoncia, Ortopedia Dentomaxilofacial y Cirugía Ortognática.\n\
        Paciente: {} {}, Edad: {:.1} años, Sexo: {}, Etnia/Raza: {}, País: {}.\n\
        Estudio: Telerradiografía ({}) — Análisis Cefalométrico: {}.\n\
        Referencia bibliográfica base: {}.\n\n\
        Mediciones obtenidas:\n{}\n\
        Por favor entrega en español:\n\
        1. Síntesis diagnóstica integral (esquelética sagital, vertical, dentoalveolar, tejidos blandos, vía aérea/articular según corresponda y ajuste por edad/etnia).\n\
        2. Diagnóstico diferencial estructural.\n\
        3. Recomendaciones terapéuticas basadas en la literatura científica (ortopedia, ortodoncia biomecánica, anclaje esquelético TADs/MSE o cirugía ortognática).\n\
        4. Referencias clásicas y actuales de la literatura.",
        demo.first_name,
        demo.last_name,
        demo.age_years,
        demo.sex,
        demo.ethnicity,
        demo.country,
        demo.modality,
        analysis.name,
        analysis.literature_reference,
        metrics_txt
    )
}

pub async fn interpret_analysis_with_ai(
    cfg: &LlmRequestConfig,
    demo: &PatientDemographics,
    analysis: &AnalysisResult,
) -> Result<LlmInterpretationResponse> {
    let prompt = build_clinical_prompt(demo, analysis);
    let provider = cfg.provider.to_lowercase();

    if provider == "offline" || cfg.api_key.trim().is_empty() {
        return Ok(generate_offline_literature_interpretation(demo, analysis));
    }

    let client = Client::new();

    match provider.as_str() {
        "openai" | "chatgpt" => {
            let model = if cfg.model.is_empty() {
                "gpt-4o"
            } else {
                &cfg.model
            };
            let res = client
                .post("https://api.openai.com/v1/chat/completions")
                .bearer_auth(cfg.api_key.trim())
                .json(&json!({
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "Eres un experto en cefalometría clínica, ortodoncia y cirugía ortognática."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2
                }))
                .send()
                .await?;
            let body: serde_json::Value = res.json().await?;
            let text = body["choices"][0]["message"]["content"]
                .as_str()
                .ok_or_else(|| anyhow!("Respuesta inválida de OpenAI: {}", body))?
                .to_string();

            Ok(LlmInterpretationResponse {
                provider_used: "OpenAI (ChatGPT)".into(),
                model_used: model.into(),
                clinical_synthesis: text,
                differential_diagnosis: vec![analysis.summary_diagnosis.clone()],
                treatment_recommendations: analysis.recommendations.clone(),
                literature_citations: vec![analysis.literature_reference.clone()],
            })
        }
        "anthropic" | "claude" => {
            let model = if cfg.model.is_empty() {
                "claude-3-7-sonnet-latest"
            } else {
                &cfg.model
            };
            let res = client
                .post("https://api.anthropic.com/v1/messages")
                .header("x-api-key", cfg.api_key.trim())
                .header("anthropic-version", "2023-06-01")
                .json(&json!({
                    "model": model,
                    "max_tokens": 1800,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                }))
                .send()
                .await?;
            let body: serde_json::Value = res.json().await?;
            let text = body["content"][0]["text"]
                .as_str()
                .ok_or_else(|| anyhow!("Respuesta inválida de Claude: {}", body))?
                .to_string();

            Ok(LlmInterpretationResponse {
                provider_used: "Anthropic (Claude)".into(),
                model_used: model.into(),
                clinical_synthesis: text,
                differential_diagnosis: vec![analysis.summary_diagnosis.clone()],
                treatment_recommendations: analysis.recommendations.clone(),
                literature_citations: vec![analysis.literature_reference.clone()],
            })
        }
        "gemini" | "google" => {
            let model = if cfg.model.is_empty() {
                "gemini-2.5-flash"
            } else {
                &cfg.model
            };
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
                model,
                cfg.api_key.trim()
            );
            let res = client
                .post(&url)
                .json(&json!({
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }]
                }))
                .send()
                .await?;
            let body: serde_json::Value = res.json().await?;
            let text = body["candidates"][0]["content"]["parts"][0]["text"]
                .as_str()
                .ok_or_else(|| anyhow!("Respuesta inválida de Gemini: {}", body))?
                .to_string();

            Ok(LlmInterpretationResponse {
                provider_used: "Google (Gemini)".into(),
                model_used: model.into(),
                clinical_synthesis: text,
                differential_diagnosis: vec![analysis.summary_diagnosis.clone()],
                treatment_recommendations: analysis.recommendations.clone(),
                literature_citations: vec![analysis.literature_reference.clone()],
            })
        }
        other => Err(anyhow!("Proveedor IA no reconocido: {}", other)),
    }
}

pub fn generate_offline_literature_interpretation(
    demo: &PatientDemographics,
    analysis: &AnalysisResult,
) -> LlmInterpretationResponse {
    let out_of_range: Vec<String> = analysis
        .measurements
        .iter()
        .filter(|m| m.status != "normal")
        .map(|m| {
            format!(
                "{} = {:.2}{} (norma {:.1}..{:.1}): {}",
                m.label, m.value, m.unit, m.norm_min, m.norm_max, m.interpretation
            )
        })
        .collect();

    let synthesis = if out_of_range.is_empty() {
        format!(
            "Paciente {} {} ({:.0} años, sexo {}, etnia {}, {}). Todos los parámetros evaluados en {} se encuentran dentro de los rangos normativos fisiológicos. {}",
            demo.first_name, demo.last_name, demo.age_years, demo.sex, demo.ethnicity, demo.country, analysis.name, analysis.summary_diagnosis
        )
    } else {
        format!(
            "Paciente {} {} ({:.0} años, sexo {}, etnia {}, {}). En el análisis {} se identifican {} hallazgos fuera de rango normativo: {}. Síntesis: {}",
            demo.first_name,
            demo.last_name,
            demo.age_years,
            demo.sex,
            demo.ethnicity,
            demo.country,
            analysis.name,
            out_of_range.len(),
            out_of_range.join("; "),
            analysis.summary_diagnosis
        )
    };

    LlmInterpretationResponse {
        provider_used: "Motor Clínico Basado en Evidencia (Local)".into(),
        model_used: "Caphalopodo-Literature-Engine-v2".into(),
        clinical_synthesis: synthesis,
        differential_diagnosis: if out_of_range.is_empty() {
            vec!["Armonía craneomaxilomandibular y dentoalveolar conservada.".into()]
        } else {
            out_of_range
        },
        treatment_recommendations: analysis.recommendations.clone(),
        literature_citations: vec![
            analysis.literature_reference.clone(),
            "Proffit WR, Fields HW, Larson BE, Sarver DM (2019) Contemporary Orthodontics, 6th Ed. Elsevier.".into(),
            "Delaire J, Schendel SA, Tulasne JF (1981) An architectural and structural craniofacial analysis: a new lateral cephalometric analysis, Oral Surg Oral Med Oral Pathol 52(3):226-238.".into(),
        ],
    }
}
