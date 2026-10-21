use anyhow::{Context, Result};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use dicom_dictionary_std::tags;
use dicom_object::open_file;
use dicom_pixeldata::PixelDecoder;
use image::ImageFormat;
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use std::path::Path;

/// Patient & radiographic metadata extracted from DICOM tags or user input.
/// Mirrors and extends `Delaire_BO.Patient` and `Delaire_BL.DICOMHelper`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatientDemographics {
    pub patient_id: String,
    pub first_name: String,
    pub last_name: String,
    pub age_years: f64,
    pub birth_date: String,
    pub sex: String,       // "M", "F", "O"
    pub ethnicity: String, // "Caucasian", "Hispanic/Latin", "Asian", "Afro-descendant", "Indigenous/Andean", "Mediterranean"
    pub country: String,
    pub study_date: String,
    pub modality: String,  // "Lateral", "Frontal", "OPG"
    pub mm_per_pixel: f64,
    pub dicom_tags_found: Vec<(String, String)>,
}

impl Default for PatientDemographics {
    fn default() -> Self {
        Self {
            patient_id: "DOS-0001".into(),
            first_name: "Paciente".into(),
            last_name: "Sin Nombre".into(),
            age_years: 18.0,
            birth_date: "".into(),
            sex: "F".into(),
            ethnicity: "Hispanic/Latin".into(),
            country: "Chile".into(),
            study_date: "2026-10-20".into(),
            modality: "Lateral".into(),
            mm_per_pixel: 0.1,
            dicom_tags_found: vec![],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoadedMedicalImage {
    pub file_name: String,
    pub file_format: String,
    pub width: u32,
    pub height: u32,
    pub data_url: String,
    pub demographics: PatientDemographics,
}

/// Parses a DICOM (`0010,0010`) Person Name `LastName^FirstName^Middle^Prefix^Suffix`.
pub fn parse_dicom_person_name(raw_pn: &str) -> (String, String) {
    let cleaned = raw_pn.trim().replace('^', "|");
    let parts: Vec<&str> = cleaned.split('|').map(|s| s.trim()).collect();
    match parts.as_slice() {
        [last, first, ..] if !last.is_empty() || !first.is_empty() => {
            (first.to_string(), last.to_string())
        }
        [single] if !single.is_empty() => {
            let words: Vec<&str> = single.split_whitespace().collect();
            if words.len() >= 2 {
                (words[0].to_string(), words[1..].join(" "))
            } else {
                (single.to_string(), String::new())
            }
        }
        _ => ("Paciente".into(), "DICOM".into()),
    }
}

/// Parses DICOM age string like `"014Y"`, `"018Y"`, `"156M"`.
pub fn parse_dicom_age(raw_age: &str) -> Option<f64> {
    let s = raw_age.trim().to_uppercase();
    if s.is_empty() {
        return None;
    }
    let digits: String = s.chars().take_while(|c| c.is_ascii_digit()).collect();
    let val: f64 = digits.parse().ok()?;
    if s.ends_with('M') {
        Some((val / 12.0 * 10.0).round() / 10.0)
    } else if s.ends_with('W') {
        Some((val / 52.0 * 10.0).round() / 10.0)
    } else {
        Some(val)
    }
}

/// Loads a medical image (`.dcm`, `.dicom`, `.jpg`, `.jpeg`, `.png`, `.bmp`) from disk.
pub fn load_medical_image_from_path(path_str: &str) -> Result<LoadedMedicalImage> {
    let path = Path::new(path_str);
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("image")
        .to_string();

    if ext == "dcm" || ext == "dicom" {
        let obj = open_file(path).context("No se pudo abrir el archivo DICOM")?;
        let mut demo = PatientDemographics::default();

        let get_tag = |tag| -> Option<String> {
            obj.element(tag)
                .ok()
                .and_then(|e| e.to_str().ok())
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
        };

        if let Some(pn) = get_tag(tags::PATIENT_NAME) {
            let (first, last) = parse_dicom_person_name(&pn);
            demo.first_name = first;
            demo.last_name = last;
            demo.dicom_tags_found.push(("0010,0010 PatientName".into(), pn));
        }
        if let Some(pid) = get_tag(tags::PATIENT_ID) {
            demo.patient_id = pid.clone();
            demo.dicom_tags_found.push(("0010,0020 PatientID".into(), pid));
        }
        if let Some(dob) = get_tag(tags::PATIENT_BIRTH_DATE) {
            demo.birth_date = dob.clone();
            demo.dicom_tags_found.push(("0010,0030 PatientBirthDate".into(), dob));
        }
        if let Some(age_str) = get_tag(tags::PATIENT_AGE) {
            if let Some(age) = parse_dicom_age(&age_str) {
                demo.age_years = age;
            }
            demo.dicom_tags_found.push(("0010,1010 PatientAge".into(), age_str));
        }
        if let Some(sex) = get_tag(tags::PATIENT_SEX) {
            demo.sex = sex.clone();
            demo.dicom_tags_found.push(("0010,0040 PatientSex".into(), sex));
        }
        if let Some(eth) = get_tag(tags::ETHNIC_GROUP) {
            demo.ethnicity = eth.clone();
            demo.dicom_tags_found.push(("0010,2160 EthnicGroup".into(), eth));
        }
        if let Some(country) = get_tag(tags::COUNTRY_OF_RESIDENCE) {
            demo.country = country.clone();
            demo.dicom_tags_found
                .push(("0010,2150 CountryOfResidence".into(), country));
        }
        if let Some(sdate) = get_tag(tags::STUDY_DATE) {
            demo.study_date = sdate.clone();
            demo.dicom_tags_found.push(("0008,0020 StudyDate".into(), sdate));
        }
        if let Some(spacing) = get_tag(tags::IMAGER_PIXEL_SPACING).or_else(|| get_tag(tags::PIXEL_SPACING)) {
            if let Some(first_val) = spacing.split('\\').next() {
                if let Ok(mm) = first_val.trim().parse::<f64>() {
                    if mm > 0.001 && mm < 5.0 {
                        demo.mm_per_pixel = mm;
                    }
                }
            }
            demo.dicom_tags_found.push(("0018,1164 PixelSpacing".into(), spacing));
        }

        let decoded = obj
            .decode_pixel_data()
            .context("No se pudo decodificar PixelData del archivo DICOM")?;
        let dyn_img = decoded
            .to_dynamic_image(0)
            .context("No se pudo convertir el frame DICOM a imagen")?;
        let width = dyn_img.width();
        let height = dyn_img.height();

        let mut png_bytes: Vec<u8> = Vec::new();
        dyn_img.write_to(&mut Cursor::new(&mut png_bytes), ImageFormat::Png)?;
        let data_url = format!("data:image/png;base64,{}", BASE64.encode(&png_bytes));

        Ok(LoadedMedicalImage {
            file_name,
            file_format: "DICOM".into(),
            width,
            height,
            data_url,
            demographics: demo,
        })
    } else {
        let bytes = std::fs::read(path).context("No se pudo leer el archivo de imagen")?;
        let img = image::load_from_memory(&bytes).context("Formato de imagen no soportado")?;
        let width = img.width();
        let height = img.height();
        let mut png_bytes: Vec<u8> = Vec::new();
        img.write_to(&mut Cursor::new(&mut png_bytes), ImageFormat::Png)?;
        let data_url = format!("data:image/png;base64,{}", BASE64.encode(&png_bytes));

        Ok(LoadedMedicalImage {
            file_name,
            file_format: ext.to_uppercase(),
            width,
            height,
            data_url,
            demographics: PatientDemographics::default(),
        })
    }
}
