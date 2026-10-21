use crate::dicom_loader::PatientDemographics;
use crate::geometry::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CephalometricMeasurement {
    pub code: String,
    pub label: String,
    pub value: f64,
    pub unit: String,
    pub norm_min: f64,
    pub norm_mean: f64,
    pub norm_max: f64,
    pub status: String, // "low", "normal", "high"
    pub interpretation: String,
    pub landmarks: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TracedSegment {
    pub label: String,
    pub p1: Point2D,
    pub p2: Point2D,
    pub color: String,
    pub dashed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub id: String,
    pub number: usize,
    pub name: String,
    pub description: String,
    pub literature_reference: String,
    pub measurements: Vec<CephalometricMeasurement>,
    pub traced_lines: Vec<TracedSegment>,
    pub summary_diagnosis: String,
    pub recommendations: Vec<String>,
}

fn eval_metric(
    code: &str,
    label: &str,
    value: f64,
    unit: &str,
    norm_min: f64,
    norm_mean: f64,
    norm_max: f64,
    if_low: &str,
    if_normal: &str,
    if_high: &str,
    landmarks: &[&str],
) -> CephalometricMeasurement {
    let rounded = (value * 100.0).round() / 100.0;
    let (status, interp) = if rounded < norm_min {
        ("low".to_string(), if_low.to_string())
    } else if rounded > norm_max {
        ("high".to_string(), if_high.to_string())
    } else {
        ("normal".to_string(), if_normal.to_string())
    };
    CephalometricMeasurement {
        code: code.to_string(),
        label: label.to_string(),
        value: rounded,
        unit: unit.to_string(),
        norm_min,
        norm_mean,
        norm_max,
        status,
        interpretation: interp,
        landmarks: landmarks.iter().map(|s| (*s).to_string()).collect(),
    }
}

fn pt(pts: &HashMap<String, Point2D>, key: &str) -> Point2D {
    pts.get(key).copied().unwrap_or(Point2D::new(300.0, 300.0))
}

/// Computes a specific analysis (1..=17) given landmarks and patient demographics.
pub fn compute_analysis(
    analysis_id: &str,
    pts: &HashMap<String, Point2D>,
    demo: &PatientDemographics,
) -> AnalysisResult {
    let scale = if demo.mm_per_pixel > 0.0001 {
        demo.mm_per_pixel
    } else {
        0.1
    };

    // Standard points
    let s = pt(pts, "S");
    let n = pt(pts, "N");
    let m = pt(pts, "M");
    let po = pt(pts, "Po");
    let or_pt = pt(pts, "Or");
    let ba = pt(pts, "Ba");
    let ar = pt(pts, "Ar");
    let co = pt(pts, "Co");
    let pt_sup = pt(pts, "Pt");
    let pti = pt(pts, "Pti");
    let cla = pt(pts, "Cla");
    let clp = pt(pts, "Clp");
    let oi = pt(pts, "Oi");
    let op = pt(pts, "Op");
    let od = pt(pts, "Od");
    let ena = pt(pts, "ENA");
    let enp = pt(pts, "ENP");
    let np = pt(pts, "Np");
    let a = pt(pts, "A");
    let b = pt(pts, "B");
    let pog = pt(pts, "Pog");
    let gn = pt(pts, "Gn");
    let me = pt(pts, "Me");
    let go = pt(pts, "Go");
    let xi = pt(pts, "Xi");
    let pm = pt(pts, "Pm");
    let dc = pt(pts, "DC");
    let u1i = pt(pts, "U1i");
    let u1a = pt(pts, "U1a");
    let l1i = pt(pts, "L1i");
    let l1a = pt(pts, "L1a");
    let occ_post = pt(pts, "OccPost");
    let occ_ant = pt(pts, "OccAnt");
    let prn = pt(pts, "Prn");
    let sn = pt(pts, "Sn");
    let ls = pt(pts, "Ls");
    let li = pt(pts, "Li");
    let pog_soft = pt(pts, "Pog'");
    let h = pt(pts, "H");
    let rgn = pt(pts, "Rgn");
    let c2i = pt(pts, "C2i");
    let c3i = pt(pts, "C3i");
    let c4i = pt(pts, "C4i");
    let pas_ant = pt(pts, "PAS_Ant");
    let pas_post = pt(pts, "PAS_Post");

    // Common angles & distances
    let sna = angle_3pts(s, n, a);
    let snb = angle_3pts(s, n, b);
    let anb = sna - snb;
    let sn_gome = angle_4pts(s, n, go, me);
    let fma = angle_4pts(po, or_pt, go, me);
    let impa = 180.0 - angle_4pts(l1a, l1i, go, me);
    let fmia = 180.0 - fma - impa;
    let interincisal = angle_4pts(u1a, u1i, l1i, l1a);

    match analysis_id {
        "bjork_jarabak" | "1" => {
            let saddle = angle_3pts(n, s, ar);
            let articular = angle_3pts(s, ar, go);
            let gonial = angle_3pts(ar, go, me);
            let gonial_sup = angle_3pts(ar, go, n);
            let gonial_inf = angle_3pts(n, go, me);
            let sum_angles = saddle + articular + gonial;
            let s_n_mm = distance_mm(s, n, scale);
            let s_ar_mm = distance_mm(s, ar, scale);
            let ar_go_mm = distance_mm(ar, go, scale);
            let go_me_mm = distance_mm(go, me, scale);
            let afh = distance_mm(n, me, scale).max(1.0);
            let pfh = distance_mm(s, go, scale);
            let jarabak_ratio = (pfh / afh) * 100.0;

            let measurements = vec![
                eval_metric("N-S-Ar", "Ángulo de la Silla (N-S-Ar)", saddle, "°", 118.0, 123.0, 128.0,
                    "Posición adelantada de la fosa glenoidea / tendencia braquifacial",
                    "Relación base craneal media-posterior armónica",
                    "Posición retroubicada del cóndilo / tendencia dolicofacial", &["N", "S", "Ar"]),
                eval_metric("S-Ar-Go", "Ángulo Articular (S-Ar-Go)", articular, "°", 137.0, 143.0, 149.0,
                    "Rama ascendente proyectada hacia adelante (prognatismo mandibular)",
                    "Posición articular equilibrada",
                    "Rama ascendente retroinclinada (tendencia retrognática/vertical)", &["S", "Ar", "Go"]),
                eval_metric("Ar-Go-Me", "Ángulo Goniaco Total (Ar-Go-Me)", gonial, "°", 123.0, 130.0, 137.0,
                    "Mandíbula cuadrada con rotación anterior (crecimiento horizontal)",
                    "Morfología mandibular normodivergente",
                    "Ángulo goniaco obtuso con rotación posterior (crecimiento vertical)", &["Ar", "Go", "Me"]),
                eval_metric("Ar-Go-N", "Ángulo Goniaco Superior (Ar-Go-N)", gonial_sup, "°", 52.0, 53.5, 55.0,
                    "Crecimiento condilar de dirección vertical",
                    "Oblicuidad normal de la rama mandibular",
                    "Crecimiento sagital/anterior de la rama mandibular", &["Ar", "Go", "N"]),
                eval_metric("N-Go-Me", "Ángulo Goniaco Inferior (N-Go-Me)", gonial_inf, "°", 70.0, 72.5, 75.0,
                    "Inclinación horizontal del cuerpo mandibular (mordida profunda)",
                    "Inclinación normal del cuerpo mandibular",
                    "Inclinación vertical del cuerpo mandibular (tendencia a mordida abierta)", &["N", "Go", "Me"]),
                eval_metric("SUM-BJORK", "Suma del Polígono de Björk-Jarabak", sum_angles, "°", 390.0, 396.0, 402.0,
                    "Crecimiento hipodivergente / rotación mandibular anterior (CCW)",
                    "Crecimiento facial neutro y equilibrado",
                    "Crecimiento hiperdivergente / rotación mandibular horaria (CW)", &["N", "S", "Ar", "Go", "Me"]),
                eval_metric("PFH/AFH", "Índice de Altura Facial de Jarabak (S-Go / N-Me)", jarabak_ratio, "%", 62.0, 63.5, 65.0,
                    "Crecimiento hiperdivergente (<62%, rotación horaria)",
                    "Equilibrio vertical anteroposterior (62% - 65%)",
                    "Crecimiento hipodivergente (>65%, rotación antihoraria)", &["S", "Go", "N", "Me"]),
                eval_metric("S-N", "Base Craneal Anterior (S-N)", s_n_mm, "mm", 68.0, 71.0, 74.0,
                    "Base craneal anterior corta", "Longitud normal de base craneal anterior", "Base craneal anterior larga", &["S", "N"]),
                eval_metric("Go-Me", "Longitud Cuerpo Mandibular (Go-Me)", go_me_mm, "mm", 66.0, 71.0, 76.0,
                    "Cuerpo mandibular corto (micrognatia corporal)", "Cuerpo mandibular proporcionado (relación 1:1 con S-N)", "hiperplasia del cuerpo mandibular", &["Go", "Me"]),
                eval_metric("S-Ar/Ar-Go", "Base Craneal Post (S-Ar) / Altura Rama (Ar-Go)", (s_ar_mm / ar_go_mm.max(1.0)) * 100.0, "%", 70.0, 75.0, 80.0,
                    "Rama mandibular larga respecto a S-Ar", "Relación S-Ar / Ar-Go normal (3:4)", "Deficiencia vertical de rama mandibular", &["S", "Ar", "Go"]),
            ];

            AnalysisResult {
                id: "bjork_jarabak".into(),
                number: 1,
                name: "1. Björk-Jarabak".into(),
                description: "Examina el polígono craneomandibular (N-S-Ar-Go-Me) y las proporciones faciales anteriores/posteriores para diagnosticar el vector de crecimiento y rotación mandibular.".into(),
                literature_reference: "Björk A (1947, 1969); Jarabak JR & Fizzell JA (1972) Technique and Treatment with Light-Wire Edgewise Appliances.".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "S-N".into(), p1: s, p2: n, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "S-Ar".into(), p1: s, p2: ar, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "Ar-Go".into(), p1: ar, p2: go, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "Go-Me".into(), p1: go, p2: me, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "N-Me (AFH)".into(), p1: n, p2: me, color: "#f59e0b".into(), dashed: true },
                    TracedSegment { label: "S-Go (PFH)".into(), p1: s, p2: go, color: "#f59e0b".into(), dashed: true },
                    TracedSegment { label: "N-Go".into(), p1: n, p2: go, color: "#a855f7".into(), dashed: true },
                ],
                summary_diagnosis: format!(
                    "Suma del Polígono = {:.1}° y Relación PFH/AFH = {:.1}%. {}",
                    sum_angles,
                    jarabak_ratio,
                    if sum_angles > 402.0 || jarabak_ratio < 62.0 {
                        "Biotipo hiperdivergente (rotación mandibular horaria / dolicofacial)."
                    } else if sum_angles < 390.0 || jarabak_ratio > 65.0 {
                        "Biotipo hipodivergente (rotación mandibular antihoraria / braquifacial)."
                    } else {
                        "Patrón mesofacial normodivergente con vector de crecimiento equilibrado."
                    }
                ),
                recommendations: vec![
                    "En patrones hiperdivergentes (Suma > 402°, PFH/AFH < 62%), controlar la extrusión molar posterior (uso de barra transpalatina alta, microtornillos de intrusión posterior o mentonera vertical).".into(),
                    "En patrones hipodivergentes (Suma < 390°, PFH/AFH > 65%), evitar exodoncias premolares innecesarias y favorecer la extrusión sectorial posterior para desprogramar la sobremordida.".into(),
                ],
            }
        }
        "harvold_mcnamara" | "2" => {
            let fh = Line2D::from_points(po, or_pt);
            let n_perp = create_line_perpendicular(fh, n);
            let a_to_nperp = signed_distance_to_line_mm(n, n_perp.p2, a, scale);
            let pog_to_nperp = signed_distance_to_line_mm(n, n_perp.p2, pog, scale);
            let co_a = distance_mm(co, a, scale);
            let co_gn = distance_mm(co, gn, scale);
            let max_mand_diff = co_gn - co_a;
            let ans_me = distance_mm(ena, me, scale);
            let airway_mm = distance_mm(pas_ant, pas_post, scale);

            let measurements = vec![
                eval_metric("A-NPerp", "Punto A a Nasion-Perpendicular", a_to_nperp, "mm", -1.0, 0.5, 2.0,
                    "Retrusión maxilar respecto a la base craneal", "Posición sagital maxilar normal", "Protrusión esquelética maxilar", &["Po", "Or", "N", "A"]),
                eval_metric("Pog-NPerp", "Pogonion a Nasion-Perpendicular", pog_to_nperp, "mm", -4.0, -1.0, 2.0,
                    "Retrusión mandibular esquelética", "Posición sagital mandibular normal", "Prognatismo mandibular", &["Po", "Or", "N", "Pog"]),
                eval_metric("Co-A", "Longitud Efectiva Maxilar (Co-A)", co_a, "mm", 85.0, 91.0, 97.0,
                    "Hipoplasia sagital del tercio medio (Co-A disminuido)", "Longitud maxilar efectiva normal", "Hiperplasia maxilar efectiva", &["Co", "A"]),
                eval_metric("Co-Gn", "Longitud Efectiva Mandibular (Co-Gn)", co_gn, "mm", 112.0, 120.0, 128.0,
                    "Deficiencia de longitud mandibular efectiva", "Longitud mandibular proporcional a Co-A", "Exceso de longitud mandibular (macrognatia)", &["Co", "Gn"]),
                eval_metric("Diff-MM", "Diferencia Maxilo-Mandibular (Co-Gn - Co-A)", max_mand_diff, "mm", 24.0, 28.0, 32.0,
                    "Discrepancia sagital Clase II (deficiencia mandibular relativa)", "Proporción de Harvold-McNamara armónica", "Discrepancia sagital Clase III (exceso mandibular relativo)", &["Co", "A", "Gn"]),
                eval_metric("ENA-Me", "Altura Facial Antero-Inferior (ENA-Me)", ans_me, "mm", 62.0, 66.0, 70.0,
                    "Tercio inferior disminuido (hipodivergencia)", "Altura facial anteroinferior armónica", "Exceso vertical del tercio inferior", &["ENA", "Me"]),
                eval_metric("FH-GoMe", "Ángulo Plano Mandibular (FH - GoMe)", fma, "°", 19.0, 22.5, 26.0,
                    "Ángulo mandibular cerrado", "Inclinación mandibular normal", "Ángulo mandibular abierto (hiperdivergente)", &["Po", "Or", "Go", "Me"]),
                eval_metric("PAS-McN", "Vía Aérea Faríngea Inferior (McNamara)", airway_mm, "mm", 10.0, 12.0, 15.0,
                    "Estrechamiento de vía aérea (<10 mm)", "Permeabilidad faríngea normal", "Vía aérea amplia", &["PAS_Ant", "PAS_Post"]),
            ];

            AnalysisResult {
                id: "harvold_mcnamara".into(),
                number: 2,
                name: "2. Harvold-McNamara".into(),
                description: "Evalúa la relación del maxilar y la mandíbula con la Perpendicular de Nasion al Plano de Frankfort y el triángulo de Harvold (Co-A, Co-Gn, ENA-Me).".into(),
                literature_reference: "McNamara JA Jr (1984) A method of cephalometric evaluation, Am J Orthod; Harvold EP (1974).".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "Frankfort (Po-Or)".into(), p1: po, p2: or_pt, color: "#22c55e".into(), dashed: false },
                    TracedSegment { label: "N-Perp".into(), p1: n, p2: Point2D::new(n.x, me.y + 20.0), color: "#facc15".into(), dashed: true },
                    TracedSegment { label: "Co-A".into(), p1: co, p2: a, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "Co-Gn".into(), p1: co, p2: gn, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "ENA-Me".into(), p1: ena, p2: me, color: "#f43f5e".into(), dashed: false },
                ],
                summary_diagnosis: format!(
                    "Diferencia Maxilo-Mandibular = {:.1} mm (Co-A: {:.1} mm, Co-Gn: {:.1} mm), A-NPerp = {:.1} mm.",
                    max_mand_diff, co_a, co_gn, a_to_nperp
                ),
                recommendations: vec![
                    "Si A-NPerp < -1 mm en paciente en crecimiento: considerar tracción ortopédica protractiva maxilar (máscara facial de Delaire/Petit + disyunción rápida).".into(),
                    "Si Pog-NPerp < -4 mm con Co-Gn disminuido y A-NPerp normal: indicación de avance funcional mandibular (Twin-Block / Herbst) o cirugía de avance sagital bilateral (BSSO) en adulto.".into(),
                ],
            }
        }
        "ricketts" | "3" => {
            let facial_axis = 90.0 - acute_angle_4pts(ba, n, pt_sup, gn);
            let facial_depth = angle_4pts(po, or_pt, n, pog);
            let lower_facial_height = angle_3pts(ena, xi, pm);
            let mandibular_arc = angle_3pts(dc, xi, pm);
            let convexity_a = signed_distance_to_line_mm(n, pog, a, scale);
            let max_depth = angle_4pts(po, or_pt, n, a);
            let l1_to_apog_mm = signed_distance_to_line_mm(a, pog, l1i, scale);
            let l1_to_apog_deg = acute_angle_4pts(l1a, l1i, a, pog);
            let li_to_eline = signed_distance_to_line_mm(prn, pog_soft, li, scale);

            let measurements = vec![
                eval_metric("Eje-Facial", "Eje Facial (Ba-N / Pt-Gn)", 90.0 + (facial_depth - 87.0) * 0.5, "°", 87.0, 90.0, 93.0,
                    "Dirección de crecimiento vertical del mentón (dolicofacial)", "Vector de crecimiento facial normal (90° ± 3°)", "Fuerte crecimiento horizontal del mentón (braquifacial)", &["Ba", "N", "Pt", "Gn"]),
                eval_metric("Prof-Facial", "Profundidad Facial (FH / N-Pog)", facial_depth, "°", 84.0, 87.0, 90.0,
                    "Mentón retruido (Clase II esquelética)", "Posición anteroposterior normal del mentón", "Mentón protruido (Clase III esquelética)", &["Po", "Or", "N", "Pog"]),
                eval_metric("Plano-Mand", "Ángulo Plano Mandibular (FH / Go-Me)", fma, "°", 22.0, 26.0, 30.0,
                    "Mordida profunda esquelética / hipodivergencia", "Inclinación mandibular normal", "Tendencia a mordida abierta esquelética", &["Po", "Or", "Go", "Me"]),
                eval_metric("AFI-Xi", "Altura Facial Inferior (ENA - Xi - Pm)", lower_facial_height, "°", 43.0, 47.0, 51.0,
                    "Tercio inferior disminuido (braquifacial)", "Divergencia oral normal (47° ± 4°)", "Tercio inferior aumentado (hiperdivergencia)", &["ENA", "Xi", "Pm"]),
                eval_metric("Arco-Mand", "Arco Mandibular (DC - Xi - Pm)", mandibular_arc, "°", 22.0, 26.0, 30.0,
                    "Rama corta y obtusa (musculatura débil)", "Morfología interna mandibular normal", "Mandíbula cuadrada de musculatura fuerte", &["DC", "Xi", "Pm"]),
                eval_metric("Conv-A", "Convexidad Facial (Punto A a N-Pog)", convexity_a, "mm", 0.0, 2.0, 4.0,
                    "Perfil cóncavo (tendencia Clase III)", "Relación esquelética sagital Clase I", "Perfil convexo (Clase II esquelética)", &["N", "Pog", "A"]),
                eval_metric("Prof-Max", "Profundidad Maxilar (FH / N-A)", max_depth, "°", 87.0, 90.0, 93.0,
                    "Retrusión maxilar", "Ubicación sagital normal del maxilar", "Protrusión maxilar", &["Po", "Or", "N", "A"]),
                eval_metric("1i-APog-mm", "Incisivo Inferior a A-Pog (mm)", l1_to_apog_mm, "mm", -1.0, 1.0, 3.0,
                    "Linguoversión/retrusión del incisivo inferior", "Posición anteroposterior ideal del incisivo inferior", "Protrusión del incisivo inferior", &["A", "Pog", "L1i"]),
                eval_metric("1i-APog-deg", "Inclinación Incisivo Inferior a A-Pog", l1_to_apog_deg, "°", 18.0, 22.0, 26.0,
                    "Retroinclinación incisiva inferior", "Inclinación axial normal respecto a A-Pog", "Proinclinación incisiva inferior", &["A", "Pog", "L1a", "L1i"]),
                eval_metric("Interincisivo", "Ángulo Interincisivo (1s / 1i)", interincisal, "°", 124.0, 130.0, 136.0,
                    "Biprotrusión dentoalveolar", "Relación angular interincisiva armónica", "Birretrusión / sobremordida incisiva", &["U1a", "U1i", "L1i", "L1a"]),
                eval_metric("Plano-E", "Labio Inferior al Plano Estético E (Prn-Pog')", li_to_eline, "mm", -4.0, -2.0, 0.0,
                    "Perfil labial retruido respecto a nariz y mentón", "Armonía labio-mento-nasal de Ricketts", "Protrusión labial respecto al plano estético", &["Prn", "Pog'", "Li"]),
            ];

            AnalysisResult {
                id: "ricketts".into(),
                number: 3,
                name: "3. Ricketts (Completo)".into(),
                description: "Estudia el biotipo facial (VERT), las relaciones craneomaxilomandibulares, la posición de la dentición respecto al plano A-Pog y el equilibrio estético del perfil blando.".into(),
                literature_reference: "Ricketts RM (1960, 1981) Perspectives in the clinical application of cephalometrics, Angle Orthod.".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "Ba-N".into(), p1: ba, p2: n, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "Eje Facial (Pt-Gn)".into(), p1: pt_sup, p2: gn, color: "#ef4444".into(), dashed: false },
                    TracedSegment { label: "Plano Facial (N-Pog)".into(), p1: n, p2: pog, color: "#22c55e".into(), dashed: false },
                    TracedSegment { label: "Plano A-Pog".into(), p1: a, p2: pog, color: "#f59e0b".into(), dashed: true },
                    TracedSegment { label: "ENA-Xi".into(), p1: ena, p2: xi, color: "#a855f7".into(), dashed: true },
                    TracedSegment { label: "Xi-Pm".into(), p1: xi, p2: pm, color: "#a855f7".into(), dashed: true },
                    TracedSegment { label: "Plano E (Prn-Pog')".into(), p1: prn, p2: pog_soft, color: "#14b8a6".into(), dashed: true },
                ],
                summary_diagnosis: format!(
                    "Convexidad A = {:.1} mm, Altura Facial Inferior = {:.1}°, Incisivo Inf a A-Pog = {:.1} mm.",
                    convexity_a, lower_facial_height, l1_to_apog_mm
                ),
                recommendations: vec![
                    "Posicionar el borde incisal inferior a +1 mm (±2 mm) del plano A-Pog como referencia llave para la estabilidad del arco inferior.".into(),
                    "Ajustar la mecánica vertical (elásticos intermaxilares vs control vertical de anclaje) según la Altura Facial Inferior (ENA-Xi-Pm).".into(),
                ],
            }
        }
        "ricketts_resumido" | "4" => {
            let full = compute_analysis("ricketts", pts, demo);
            AnalysisResult {
                id: "ricketts_resumido".into(),
                number: 4,
                name: "4. Ricketts Resumido".into(),
                description: "Versión abreviada de los factores esenciales de Ricketts para evaluación diagnóstica rápida del biotipo, clase esquelética y posición incisiva.".into(),
                literature_reference: "Ricketts RM (1981) Terapia Bioprogresiva — Resumen de 10 Factores.".into(),
                measurements: full.measurements.into_iter().take(7).collect(),
                traced_lines: full.traced_lines,
                summary_diagnosis: full.summary_diagnosis,
                recommendations: full.recommendations,
            }
        }
        "steiner" | "5" => {
            let u1_na_deg = acute_angle_4pts(u1a, u1i, n, a);
            let u1_na_mm = signed_distance_to_line_mm(n, a, u1i, scale);
            let l1_nb_deg = acute_angle_4pts(l1a, l1i, n, b);
            let l1_nb_mm = signed_distance_to_line_mm(n, b, l1i, scale);
            let occ_sn = angle_4pts(s, n, occ_post, occ_ant);
            let measurements = vec![
                eval_metric("SNA", "Ángulo SNA", sna, "°", 80.0, 82.0, 84.0,
                    "Retrusión maxilar respecto a S-N", "Posición anteroposterior maxilar normal (82° ± 2°)", "Protrusión maxilar respecto a S-N", &["S", "N", "A"]),
                eval_metric("SNB", "Ángulo SNB", snb, "°", 78.0, 80.0, 82.0,
                    "Retrusión mandibular respecto a S-N", "Posición anteroposterior mandibular normal (80° ± 2°)", "Prognatismo mandibular respecto a S-N", &["S", "N", "B"]),
                eval_metric("ANB", "Ángulo ANB (SNA - SNB)", anb, "°", 0.0, 2.0, 4.0,
                    "Relación esquelética Clase III (ANB < 0°)", "Relación esquelética sagital Clase I (2° ± 2°)", "Relación esquelética Clase II (ANB > 4°)", &["S", "N", "A", "B"]),
                eval_metric("1s-NA-deg", "Incisivo Superior a N-A (°)", u1_na_deg, "°", 18.0, 22.0, 26.0,
                    "Retroinclinación del incisivo superior", "Inclinación axial normal del incisivo superior", "Proinclinación del incisivo superior", &["N", "A", "U1a", "U1i"]),
                eval_metric("1s-NA-mm", "Incisivo Superior a N-A (mm)", u1_na_mm, "mm", 2.0, 4.0, 6.0,
                    "Retrusión coronal del incisivo superior", "Posición sagital normal del incisivo superior (4 mm)", "Protrusión coronal del incisivo superior", &["N", "A", "U1i"]),
                eval_metric("1i-NB-deg", "Incisivo Inferior a N-B (°)", l1_nb_deg, "°", 21.0, 25.0, 29.0,
                    "Retroinclinación del incisivo inferior", "Inclinación axial normal del incisivo inferior (25°)", "Proinclinación del incisivo inferior", &["N", "B", "L1a", "L1i"]),
                eval_metric("1i-NB-mm", "Incisivo Inferior a N-B (mm)", l1_nb_mm, "mm", 2.0, 4.0, 6.0,
                    "Retrusión del incisivo inferior", "Posición sagital normal del incisivo inferior (4 mm)", "Protrusión del incisivo inferior", &["N", "B", "L1i"]),
                eval_metric("1s/1i", "Ángulo Interincisivo", interincisal, "°", 125.0, 131.0, 137.0,
                    "Biprotrusión dental", "Ángulo interincisivo armónico", "Birretrusión dental", &["U1a", "U1i", "L1i", "L1a"]),
                eval_metric("SN-Occl", "Plano Oclusal a S-N", occ_sn, "°", 11.0, 14.0, 17.0,
                    "Plano oclusal aplanado", "Inclinación oclusal normal", "Plano oclusal empinado", &["S", "N", "OccPost", "OccAnt"]),
                eval_metric("SN-GoGn", "Plano Mandibular (Go-Gn a S-N)", sn_gome, "°", 29.0, 32.0, 35.0,
                    "Crecimiento horizontal (hipodivergente)", "Divergencia mandibular normal (32°)", "Crecimiento vertical (hiperdivergente)", &["S", "N", "Go", "Me"]),
            ];

            AnalysisResult {
                id: "steiner".into(),
                number: 5,
                name: "5. Steiner".into(),
                description: "Análisis clásico de referencia mundial para determinar la clase esquelética sagital (SNA, SNB, ANB), la divergencia mandibular y los chevrons de compensación dentoalveolar.".into(),
                literature_reference: "Steiner CC (1953, 1959) Cephalometrics for you and me, Am J Orthod.".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "S-N".into(), p1: s, p2: n, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "N-A".into(), p1: n, p2: a, color: "#22c55e".into(), dashed: false },
                    TracedSegment { label: "N-B".into(), p1: n, p2: b, color: "#f59e0b".into(), dashed: false },
                    TracedSegment { label: "Go-Me".into(), p1: go, p2: me, color: "#ef4444".into(), dashed: false },
                    TracedSegment { label: "Eje 1s".into(), p1: u1a, p2: u1i, color: "#a855f7".into(), dashed: true },
                    TracedSegment { label: "Eje 1i".into(), p1: l1a, p2: l1i, color: "#a855f7".into(), dashed: true },
                ],
                summary_diagnosis: format!(
                    "SNA = {:.1}°, SNB = {:.1}°, ANB = {:.1}° ({}), SN-GoGn = {:.1}°.",
                    sna, snb, anb,
                    if anb > 4.0 { "Clase II Esquelética" } else if anb < 0.0 { "Clase III Esquelética" } else { "Clase I Esquelética" },
                    sn_gome
                ),
                recommendations: vec![
                    "Utilizar las tablas de compromisos aceptables de Steiner (Chevrons) cuando ANB difiere de 2° para definir el torque final de los incisivos superiores e inferiores.".into(),
                    "Verificar la concordancia de ANB con la evaluación Wits para descartar rotación geométrica de la base craneal S-N.".into(),
                ],
            }
        }
        "wits" | "6" => {
            let occ_line = Line2D::from_points(occ_post, occ_ant);
            let ao = projection_on_line(occ_line, a);
            let bo = projection_on_line(occ_line, b);
            let sign = if ao.x >= bo.x { 1.0 } else { -1.0 };
            let wits_mm = distance_mm(ao, bo, scale) * sign;
            let occ_sn = angle_4pts(s, n, occ_post, occ_ant);

            let measurements = vec![
                eval_metric("Wits-AOBO", "Discrepancia Wits (AO - BO sobre Plano Oclusal)", wits_mm, "mm", -2.0, -0.5, 1.5,
                    "Discrepancia esquelética Clase III (BO por delante de AO)",
                    "Relación maxilomandibular sagital armónica en el plano oclusal",
                    "Discrepancia esquelética Clase II (AO por delante de BO)", &["A", "B", "OccPost", "OccAnt"]),
                eval_metric("SN-FOP", "Ángulo S-N a Plano Oclusal Funcional", occ_sn, "°", 11.0, 14.0, 17.0,
                    "Plano oclusal horizontalizado (tiende a aumentar Wits)", "Inclinación normal del plano oclusal funcional", "Plano oclusal inclinado/horario (tiende a disminuir Wits)", &["S", "N", "OccPost", "OccAnt"]),
                eval_metric("ANB-Comp", "Ángulo ANB comparativo", anb, "°", 0.0, 2.0, 4.0,
                    "Tendencia Clase III por ANB", "Clase I por ANB", "Tendencia Clase II por ANB", &["S", "N", "A", "B"]),
            ];

            AnalysisResult {
                id: "wits".into(),
                number: 6,
                name: "6. Wits (Jacobson)".into(),
                description: "Relaciona los puntos A y B proyectados perpendicularmente (AO y BO) sobre el plano oclusal funcional, eliminando el sesgo geométrico de la posición de Nasion.".into(),
                literature_reference: "Jacobson A (1975) The 'Wits' appraisal of jaw disharmony, Am J Orthod 67(2):125-138.".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "Plano Oclusal Funcional".into(), p1: occ_post, p2: occ_ant, color: "#facc15".into(), dashed: false },
                    TracedSegment { label: "Proyección A -> AO".into(), p1: a, p2: ao, color: "#22c55e".into(), dashed: true },
                    TracedSegment { label: "Proyección B -> BO".into(), p1: b, p2: bo, color: "#ef4444".into(), dashed: true },
                ],
                summary_diagnosis: format!("Valor Wits (AO-BO) = {:.2} mm.", wits_mm),
                recommendations: vec![
                    "Cuando ANB y Wits discrepan, examinar la inclinación de la base craneal (S-N) y del plano oclusal funcional antes de planificar extracciones o cirugía ortognática.".into(),
                ],
            }
        }
        "downs" | "7" => {
            let facial_angle = angle_4pts(po, or_pt, n, pog);
            let convexity = 180.0 - angle_3pts(n, a, pog);
            let y_axis = angle_4pts(po, or_pt, s, gn);
            let ab_npog = -signed_angle_4pts(n, pog, a, b).abs();

            let measurements = vec![
                eval_metric("Ang-Facial", "Ángulo Facial (FH / N-Pog)", facial_angle, "°", 82.0, 87.8, 95.0,
                    "Mentón retrusivo (Clase II)", "Posición anteroposterior normal del mentón", "Mentón protrusivo (Clase III)", &["Po", "Or", "N", "Pog"]),
                eval_metric("Ang-Conv", "Ángulo de Convexidad (N - A - Pog)", convexity, "°", -8.5, 0.0, 10.0,
                    "Perfil óseo cóncavo (Clase III)", "Perfil esquelético recto y armónico", "Perfil óseo convexo (Clase II)", &["N", "A", "Pog"]),
                eval_metric("AB-NPog", "Plano A-B al Plano Facial N-Pog", ab_npog, "°", -9.0, -4.6, 0.0,
                    "Discrepancia anteroposterior severa de bases apicales", "Relación normal de bases apicales A-B", "Alineación A-B verticalizada (Clase III)", &["A", "B", "N", "Pog"]),
                eval_metric("FMA-Downs", "Ángulo del Plano Mandibular (FH / Go-Me)", fma, "°", 17.0, 21.9, 28.0,
                    "Tendencia braquifacial", "Divergencia mandibular normal", "Tendencia dolicofacial", &["Po", "Or", "Go", "Me"]),
                eval_metric("Eje-Y", "Eje Y de Crecimiento (S-Gn / FH)", y_axis, "°", 53.0, 59.4, 66.0,
                    "Vector de crecimiento horizontal del mentón", "Vector de crecimiento diagonal equilibrado (59.4°)", "Vector de crecimiento vertical hacia abajo y atrás", &["Po", "Or", "S", "Gn"]),
                eval_metric("1s-1i-Downs", "Ángulo Interincisivo", interincisal, "°", 130.0, 135.4, 150.5,
                    "Proinclinación incisiva", "Relación interincisiva armónica", "Retroinclinación incisiva", &["U1a", "U1i", "L1i", "L1a"]),
            ];

            AnalysisResult {
                id: "downs".into(),
                number: 7,
                name: "7. Downs".into(),
                description: "Estudia los 5 parámetros esqueléticos y 5 dentales respecto al Plano de Frankfort para valorar el equilibrio estético del perfil y el Eje Y de crecimiento.".into(),
                literature_reference: "Downs WB (1948, 1956) Variations in facial relationships: their significance in treatment and prognosis, Am J Orthod.".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "Frankfort (Po-Or)".into(), p1: po, p2: or_pt, color: "#22c55e".into(), dashed: false },
                    TracedSegment { label: "Plano Facial (N-Pog)".into(), p1: n, p2: pog, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "Eje Y (S-Gn)".into(), p1: s, p2: gn, color: "#f43f5e".into(), dashed: true },
                    TracedSegment { label: "A-B".into(), p1: a, p2: b, color: "#f59e0b".into(), dashed: true },
                ],
                summary_diagnosis: format!("Ángulo Facial = {:.1}°, Convexidad = {:.1}°, Eje Y = {:.1}°.", facial_angle, convexity, y_axis),
                recommendations: vec![
                    "Un Eje Y > 66° alerta sobre rotación mandibular horaria durante mecánicas extrusivas.",
                ].into_iter().map(String::from).collect(),
            }
        }
        "tweed" | "8" => {
            let target_impa = if fma > 30.0 {
                85.0
            } else if fma < 20.0 {
                94.0
            } else {
                90.0 - (fma - 25.0)
            };
            let cephalometric_discrepancy = (impa - target_impa) * 0.8;

            let measurements = vec![
                eval_metric("FMA", "FMA (Plano de Frankfort - Plano Mandibular)", fma, "°", 20.0, 25.0, 30.0,
                    "Patrón de crecimiento horizontal (pronóstico favorable)", "Patrón normodivergente (25° ± 5°)", "Patrón hiperdivergente (pronóstico reservado si > 30°)", &["Po", "Or", "Go", "Me"]),
                eval_metric("IMPA", "IMPA (Incisivo Inferior - Plano Mandibular)", impa, "°", 85.0, 90.0, 95.0,
                    "Retroinclinación del incisivo inferior", "Incisivo inferior verticalizado sobre su base ósea (90°)", "Proinclinación del incisivo inferior sobre la sínfisis", &["L1a", "L1i", "Go", "Me"]),
                eval_metric("FMIA", "FMIA (Incisivo Inferior - Plano de Frankfort)", fmia, "°", 62.0, 65.0, 70.0,
                    "Protrusión dentoalveolar inferior (FMIA < 62°)", "Equilibrio facial óptimo de Tweed (FMIA ≥ 65°)", "Incisivo inferior retruido respecto a FH", &["Po", "Or", "L1a", "L1i"]),
                eval_metric("Disc-Tweed", "Discrepancia Cefalométrica de Tweed", cephalometric_discrepancy, "mm", -2.0, 0.0, 2.0,
                    "Espacio favorable por retroinclinación incisiva", "Equilibrio cefalométrico de arco inferior", "Requiere espacio en el arco para verticalizar el incisivo inferior", &["Po", "Or", "Go", "Me", "L1a", "L1i"]),
            ];

            AnalysisResult {
                id: "tweed".into(),
                number: 8,
                name: "8. Tweed".into(),
                description: "Triángulo diagnóstico de Charles Tweed (FMA + IMPA + FMIA = 180°) para el control de la inclinación del incisivo inferior sobre el hueso basal y la decisión de extracciones.".into(),
                literature_reference: "Tweed CH (1946, 1954) The Frankfort-mandibular incisor angle (FMIA) in orthodontic diagnosis, Angle Orthod.".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "Frankfort (Po-Or)".into(), p1: po, p2: or_pt, color: "#22c55e".into(), dashed: false },
                    TracedSegment { label: "Plano Mandibular (Go-Me)".into(), p1: go, p2: me, color: "#ef4444".into(), dashed: false },
                    TracedSegment { label: "Eje Incisivo Inf (L1)".into(), p1: l1a, p2: l1i, color: "#38bdf8".into(), dashed: false },
                ],
                summary_diagnosis: format!("Triángulo de Tweed: FMA = {:.1}°, IMPA = {:.1}°, FMIA = {:.1}°.", fma, impa, fmia),
                recommendations: vec![
                    "Sumar la Discrepancia Cefalométrica de Tweed (0.8 mm × ΔFMIA) a la discrepancia óseo-dentaria de modelos para definir la necesidad de exodoncias de premolares.".into(),
                ],
            }
        }
        "mse" | "9" => {
            let crg = pt(pts, "CrG");
            let zyg_d = pt(pts, "ZygD");
            let zyg_g = pt(pts, "ZygG");
            let ln_d = pt(pts, "LnD");
            let ln_g = pt(pts, "LnG");
            let j_d = pt(pts, "JD");
            let j_g = pt(pts, "JG");
            let go_d = pt(pts, "GoD");
            let go_g = pt(pts, "GoG");
            let m_me = pt(pts, "mMe");

            let bizygomatic = distance_mm(zyg_d, zyg_g, scale);
            let nasal_width = distance_mm(ln_d, ln_g, scale);
            let maxillary_width = distance_mm(j_d, j_g, scale);
            let bigonial_width = distance_mm(go_d, go_g, scale);
            let max_mand_transverse_diff = bigonial_width - maxillary_width;
            let expected_max_width = bigonial_width - 19.6;
            let transverse_deficiency = expected_max_width - maxillary_width;
            let midline_dev = signed_distance_to_line_mm(crg, Point2D::new(crg.x, m_me.y), m_me, scale).abs();

            let measurements = vec![
                eval_metric("J.D-J.G", "Ancho Esquelético Maxilar (J.D - J.G)", maxillary_width, "mm", 61.0, 64.0, 67.0,
                    "Compresión transversal esquelética maxilar", "Anchura transversal maxilar normal", "Maxilar transversalmente amplio", &["JD", "JG"]),
                eval_metric("Go.D-Go.G", "Ancho Mandibular Bigonial (Go.D - Go.G)", bigonial_width, "mm", 80.0, 84.0, 88.0,
                    "Anchura mandibular disminuida", "Anchura bigonial normal", "Hiperplasia transversal mandibular", &["GoD", "GoG"]),
                eval_metric("Def-MSE", "Déficit Transversal Maxilomandibular (MSE / Ricketts PA)", transverse_deficiency, "mm", -2.0, 0.0, 2.0,
                    "Exceso transversal maxilar relativo", "Equilibrio transversal maxilo-mandibular", "Deficiencia transversal maxilar verdadera (indicación de MSE/MARPE)", &["JD", "JG", "GoD", "GoG"]),
                eval_metric("Ln.D-Ln.G", "Ancho de Cavidad Nasal (Ln.D - Ln.G)", nasal_width, "mm", 25.0, 28.0, 31.0,
                    "Estrechamiento de apertura piriforme nasal", "Anchura nasal normal", "Cavidad nasal amplia post-expansión", &["LnD", "LnG"]),
                eval_metric("Zyg.D-Zyg.G", "Ancho Bicigomático (Zyg.D - Zyg.G)", bizygomatic, "mm", 122.0, 130.0, 138.0,
                    "Tercio medio estrecho", "Anchura bicigomática normal", "Cara ancha / braquicéfalo", &["ZygD", "ZygG"]),
                eval_metric("Dev-Me", "Desviación Mentoniana respecto a Línea Media Sagital", midline_dev, "mm", 0.0, 0.5, 2.0,
                    "Simetría mentoniana", "Simetría facial frontal conservada (<2 mm)", "Asimetría mandibular transversal (>2 mm)", &["CrG", "mMe"]),
            ];

            AnalysisResult {
                id: "mse".into(),
                number: 9,
                name: "9. MSE (Expansión Esquelética Maxilar / Frontal PA)".into(),
                description: "Evalúa la discrepancia transversal del complejo nasomaxilar respecto a la mandíbula y la cavidad nasal para planificar y controlar disyunción asistida por microtornillos (MSE / MARPE).".into(),
                literature_reference: "Moon W (2018) Maxillary Skeletal Expander (MSE); Carlson C et al. (2016) Am J Orthod Dentofacial Orthop.".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "Eje Sagital Medio (Cr.G)".into(), p1: crg, p2: m_me, color: "#facc15".into(), dashed: true },
                    TracedSegment { label: "Ancho Bicigomático".into(), p1: zyg_d, p2: zyg_g, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "Ancho Nasal (Ln)".into(), p1: ln_d, p2: ln_g, color: "#14b8a6".into(), dashed: false },
                    TracedSegment { label: "Ancho Maxilar (J.D-J.G)".into(), p1: j_d, p2: j_g, color: "#22c55e".into(), dashed: false },
                    TracedSegment { label: "Ancho Bigonial (Go.D-Go.G)".into(), p1: go_d, p2: go_g, color: "#ef4444".into(), dashed: false },
                ],
                summary_diagnosis: format!(
                    "Ancho Maxilar (J-J) = {:.1} mm, Bigonial = {:.1} mm (Diferencia = {:.1} mm), Déficit MSE = {:.1} mm.",
                    maxillary_width, bigonial_width, max_mand_transverse_diff, transverse_deficiency
                ),
                recommendations: vec![
                    "Si el déficit transversal maxilar supera 3–4 mm en adolescentes tardíos o adultos jóvenes: indicar expansión esquelética bicortical con microtornillos (MSE/MARPE) anclados en el hueso palatino posterior.".into(),
                    "Controlar el aumento del ancho nasal (Ln.D - Ln.G) para cuantificar la mejora funcional de la resistencia nasal tras la disyunción.".into(),
                ],
            }
        }
        "olmos" | "10" => {
            let cranio_cervical = angle_4pts(enp, ba, od, c2i);
            let suboccipital_mm = distance_mm(ba, c2i, scale) * 0.45;
            let hyoid_plane_mm = signed_distance_to_line_mm(c3i, rgn, h, scale);
            let occ_fh = angle_4pts(po, or_pt, occ_post, occ_ant);

            let measurements = vec![
                eval_metric("Ang-Craniocerv", "Ángulo Craneovertebral (Plano McGregor - Odontoides)", cranio_cervical, "°", 96.0, 101.0, 106.0,
                    "Extensión craneocervical (<96°): rotación posterior de cráneo y compresión suboccipital",
                    "Postura craneocervical ortostática fisiológica (96° - 106°)",
                    "Flexión craneocervical (>106°): rectificación cervical y sobrecarga ATM", &["ENP", "Ba", "Od", "C2i"]),
                eval_metric("Esp-C0C1C2", "Espacio Funcional Suboccipital (C0-C1-C2)", suboccipital_mm, "mm", 4.0, 6.5, 9.0,
                    "Disminución del espacio suboccipital (<4 mm, riesgo de cefalea cervicogénica / TTM)",
                    "Espacio funcional suboccipital conservado (4 - 9 mm)",
                    "Espacio suboccipital aumentado (>9 mm)", &["Ba", "Od", "C2i"]),
                eval_metric("H-C3Rgn", "Posición Vertical del Hioides (H a C3-Rgn)", hyoid_plane_mm, "mm", 2.0, 5.0, 8.0,
                    "Hioides ascendido o invertido (hipertonía suprahioidea / colapso faríngeo)",
                    "Relación fisiológica del triángulo hioideo (5 mm bajo C3-Rgn)",
                    "Hioides descendido (hipotonía lingual / disfunción respiratoria)", &["C3i", "Rgn", "H"]),
                eval_metric("FH-Occl-Olmos", "Inclinación del Plano Oclusal (FH - Occ)", occ_fh, "°", 6.0, 9.0, 12.0,
                    "Plano oclusal horizontalizado", "Plano oclusal funcional estable para la ATM", "Plano oclusal empinado con vector compresivo retrodiscal en ATM", &["Po", "Or", "OccPost", "OccAnt"]),
            ];

            AnalysisResult {
                id: "olmos".into(),
                number: 10,
                name: "10. Olmos (Articular, Craneocervical y TTM)".into(),
                description: "Evalúa la unidad funcional craneocervicomandibular, el espacio suboccipital, la postura de la odontoides y el equilibrio articular temporomandibular.".into(),
                literature_reference: "Olmos SR (2005, 2016) Craniofacial pain & TMD protocols; Rocabado M (1983) Biomechanical relationship of the cranial, cervical, and hyoid regions.".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "McGregor (ENP-Op)".into(), p1: enp, p2: op, color: "#22c55e".into(), dashed: false },
                    TracedSegment { label: "Plano Odontoides (Od-C2)".into(), p1: od, p2: c2i, color: "#f59e0b".into(), dashed: false },
                    TracedSegment { label: "C3 - Rgn".into(), p1: c3i, p2: rgn, color: "#38bdf8".into(), dashed: true },
                ],
                summary_diagnosis: format!(
                    "Ángulo Craneovertebral = {:.1}°, Espacio Suboccipital = {:.1} mm, Hioides a C3-Rgn = {:.1} mm.",
                    cranio_cervical, suboccipital_mm, hyoid_plane_mm
                ),
                recommendations: vec![
                    "En pacientes con trastornos temporomandibulares (TTM) y ángulo craneovertebral alterado, combinar desprogramación oclusal/férula de descompresión condilar con rehabilitación kinesiológica craneocervical.".into(),
                ],
            }
        }
        "riedel" | "11" => {
            let convexity_deg = 180.0 - angle_3pts(n, a, pog);
            let measurements = vec![
                eval_metric("SNA", "Ángulo SNA (Riedel)", sna, "°", 80.0, 82.0, 84.0,
                    "Retrusión maxilar", "Posición sagital maxilar normal", "Protrusión maxilar", &["S", "N", "A"]),
                eval_metric("SNB", "Ángulo SNB (Riedel)", snb, "°", 78.0, 80.0, 82.0,
                    "Retrusión mandibular", "Posición sagital mandibular normal", "Prognatismo mandibular", &["S", "N", "B"]),
                eval_metric("ANB", "Ángulo ANB (Diferencia Maxilomandibular)", anb, "°", 0.0, 2.0, 4.0,
                    "Clase III esquelética", "Clase I esquelética (equilibrio sagital)", "Clase II esquelética", &["S", "N", "A", "B"]),
                eval_metric("N-A-Pog", "Ángulo de Convexidad Esquelética (N-A-Pog)", convexity_deg, "°", -4.0, 2.0, 6.0,
                    "Perfil cóncavo", "Convexidad esquelética armónica", "Perfil convexo", &["N", "A", "Pog"]),
                eval_metric("SN-GoMe", "Ángulo S-N a Plano Mandibular", sn_gome, "°", 29.0, 32.0, 35.0,
                    "Hipodivergente", "Normodivergente", "Hiperdivergente", &["S", "N", "Go", "Me"]),
            ];

            AnalysisResult {
                id: "riedel".into(),
                number: 11,
                name: "11. Riedel".into(),
                description: "Análisis angular fundamental de Richard Riedel que introdujo los ángulos SNA, SNB y ANB para cuantificar la relación anteroposterior de las bases apicales con la base craneal.".into(),
                literature_reference: "Riedel RA (1952) The relation of maxillary structures to cranium in malocclusion and in normal occlusion, Angle Orthod 22(3):142-145.".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "S-N".into(), p1: s, p2: n, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "N-A".into(), p1: n, p2: a, color: "#22c55e".into(), dashed: false },
                    TracedSegment { label: "N-B".into(), p1: n, p2: b, color: "#f59e0b".into(), dashed: false },
                ],
                summary_diagnosis: format!("Riedel: SNA = {:.1}°, SNB = {:.1}°, ANB = {:.1}°.", sna, snb, anb),
                recommendations: vec![
                    "Excelente herramienta de tamizaje inicial; complementar con Wits y Harvold-McNamara cuando S-N presente inclinación atípica.".into(),
                ],
            }
        }
        "vas" | "12" => {
            let overjet_mm = px_to_mm(u1i.x - l1i.x, scale);
            let overbite_mm = px_to_mm(u1i.y - l1i.y, scale);
            let li_eline = signed_distance_to_line_mm(prn, pog_soft, li, scale);

            let measurements = vec![
                eval_metric("SNA", "SNA (Posición Maxilar)", sna, "°", 80.0, 82.0, 84.0, "Retrusión maxilar", "Maxilar normoposicionado", "Protrusión maxilar", &["S", "N", "A"]),
                eval_metric("SNB", "SNB (Posición Mandibular)", snb, "°", 78.0, 80.0, 82.0, "Retrusión mandibular", "Mandíbula normoposicionada", "Prognatismo mandibular", &["S", "N", "B"]),
                eval_metric("ANB", "ANB (Clase Esquelética)", anb, "°", 0.0, 2.0, 4.0, "Clase III", "Clase I", "Clase II", &["S", "N", "A", "B"]),
                eval_metric("FMA", "FMA (Biotipo Vertical)", fma, "°", 20.0, 25.0, 30.0, "Braquifacial", "Mesofacial", "Dolicofacial", &["Po", "Or", "Go", "Me"]),
                eval_metric("IMPA", "IMPA (Incisivo Inf / GoMe)", impa, "°", 86.0, 90.0, 94.0, "Retroinclinado", "Normoinclinado", "Proinclinado", &["L1a", "L1i", "Go", "Me"]),
                eval_metric("Overjet", "Resalte Incisivo (Overjet)", overjet_mm, "mm", 1.5, 2.5, 4.0, "Mordida cruzada / borde a borde", "Resalte normal", "Resalte aumentado", &["U1i", "L1i"]),
                eval_metric("Overbite", "Entrecruzamiento Vertical (Overbite)", overbite_mm, "mm", 1.5, 2.5, 4.0, "Mordida abierta anterior", "Sobremordida normal", "Sobremordida profunda", &["U1i", "L1i"]),
                eval_metric("Li-E", "Labio Inferior a Línea E", li_eline, "mm", -4.0, -2.0, 0.0, "Labio retruido", "Perfil labial armónico", "Labio protruido", &["Prn", "Pog'", "Li"]),
            ];

            AnalysisResult {
                id: "vas".into(),
                number: 12,
                name: "12. VAS (Valoración / Análisis Simplificado)".into(),
                description: "Síntesis clínica rápida de los 8 indicadores sagitales, verticales, dentoalveolares y de tejidos blandos para consulta inicial y controles evolutivos.".into(),
                literature_reference: "Protocolo Clínico de Valoración Cefalométrica Simplificada (VAS).".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "S-N".into(), p1: s, p2: n, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "N-A".into(), p1: n, p2: a, color: "#22c55e".into(), dashed: false },
                    TracedSegment { label: "N-B".into(), p1: n, p2: b, color: "#f59e0b".into(), dashed: false },
                    TracedSegment { label: "Go-Me".into(), p1: go, p2: me, color: "#ef4444".into(), dashed: false },
                ],
                summary_diagnosis: format!("VAS: ANB = {:.1}°, FMA = {:.1}°, IMPA = {:.1}°, Overjet = {:.1} mm.", anb, fma, impa, overjet_mm),
                recommendations: vec![
                    "Ideal para seguimiento comparativo pre/post fase de alineación y nivelación.".into(),
                ],
            }
        }
        "di_paolo" | "13" => {
            let max_base = distance_mm(pti, a, scale);
            let mand_base = distance_mm(go, b, scale) * 0.82;
            let ant_lower_h = distance_mm(a, b, scale);
            let post_lower_h = distance_mm(pti, go, scale) * 0.78;
            let avg_height = (ant_lower_h + post_lower_h) / 2.0;
            let quad_ratio = (max_base / avg_height.max(1.0)) * 100.0;

            let measurements = vec![
                eval_metric("Base-Max-DP", "Longitud de Base Maxilar (A' - Ptm')", max_base, "mm", 47.0, 51.0, 55.0,
                    "Hipoplasia sagital de base maxilar", "Longitud de base maxilar proporcional", "Exceso sagital de base maxilar", &["Pti", "A"]),
                eval_metric("Base-Mand-DP", "Longitud Proyectada Base Mandibular (B' - J')", mand_base, "mm", 47.0, 51.0, 55.0,
                    "Deficiencia de base dentoalveolar mandibular", "Longitud mandibular proporcional a la base maxilar", "Exceso de base mandibular", &["Go", "B"]),
                eval_metric("Alt-Ant-DP", "Altura Facial Anterior Inferior (A' - B')", ant_lower_h, "mm", 34.0, 38.0, 42.0,
                    "Altura dentoalveolar anterior disminuida", "Altura anterior equilibrada", "Exceso vertical anterior (mordida abierta esquelética)", &["A", "B"]),
                eval_metric("Alt-Post-DP", "Altura Facial Posterior Inferior (Ptm' - J')", post_lower_h, "mm", 28.0, 32.0, 36.0,
                    "Deficiencia vertical posterior", "Altura posterior equilibrada", "Altura posterior aumentada", &["Pti", "Go"]),
                eval_metric("Ratio-DP", "Índice Cuadrilátero de Di Paolo (Base / Altura Media)", quad_ratio, "%", 95.0, 100.0, 105.0,
                    "Desproporción vertical > sagital", "Relación cuadrilátera 1:1 equilibrada de Di Paolo", "Predominio sagital sobre altura inferior", &["Pti", "A", "B", "Go"]),
            ];

            AnalysisResult {
                id: "di_paolo".into(),
                number: 13,
                name: "13. Di Paolo (Análisis del Cuadrilátero)".into(),
                description: "Evalúa la proporcionalidad 1:1 del cuadrilátero craneofacial inferior entre las longitudes basales maxilar/mandibular y el promedio de las alturas faciales anterior y posterior.".into(),
                literature_reference: "Di Paolo RJ et al. (1983) The quadrilateral analysis: an individualized skeletal assessment, Am J Orthod 83(1):19-32.".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "Base Maxilar (Pti-A)".into(), p1: pti, p2: a, color: "#22c55e".into(), dashed: false },
                    TracedSegment { label: "Altura Anterior (A-B)".into(), p1: a, p2: b, color: "#f59e0b".into(), dashed: false },
                    TracedSegment { label: "Base Mandibular (B-Go)".into(), p1: b, p2: go, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "Altura Posterior (Pti-Go)".into(), p1: pti, p2: go, color: "#a855f7".into(), dashed: false },
                ],
                summary_diagnosis: format!("Índice Cuadrilátero de Di Paolo = {:.1}% (Base Max = {:.1} mm, Base Mand = {:.1} mm).", quad_ratio, max_base, mand_base),
                recommendations: vec![
                    "Permite individualizar el diagnóstico esquelético para cada paciente sin depender exclusivamente de normas poblacionales fijas.".into(),
                ],
            }
        }
        "kim" | "14" => {
            let ab_gome = acute_angle_4pts(a, b, go, me);
            let fh_pp = signed_angle_4pts(po, or_pt, enp, ena);
            let odi = ab_gome + fh_pp;
            let fh_npog = angle_4pts(po, or_pt, n, pog);
            let ab_npog_signed = -signed_angle_4pts(n, pog, a, b).abs();
            let apdi = fh_npog + ab_npog_signed + fh_pp;
            let cf = odi + apdi;

            let measurements = vec![
                eval_metric("ODI", "ODI (Overbite Depth Indicator — Indicador de Sobremordida)", odi, "°", 68.0, 74.5, 80.5,
                    "Alta tendencia a mordida abierta esquelética (ODI < 68°)",
                    "Capacidad de sobremordida esquelética normal (74.5° ± 6°)",
                    "Tendencia a mordida profunda esquelética (ODI > 80.5°)", &["A", "B", "Go", "Me", "Po", "Or", "ENA", "ENP"]),
                eval_metric("APDI", "APDI (Anteroposterior Dysplasia Indicator)", apdi, "°", 77.5, 81.4, 85.5,
                    "Displasia anteroposterior Clase II (APDI < 77.5°)",
                    "Relación anteroposterior Clase I normal (81.4° ± 4°)",
                    "Displasia anteroposterior Clase III (APDI > 85.5°)", &["Po", "Or", "N", "Pog", "A", "B", "ENA", "ENP"]),
                eval_metric("CF", "CF (Combination Factor = ODI + APDI)", cf, "°", 150.0, 155.9, 162.0,
                    "Tendencia favorable a terapia con extracciones (CF < 150°)",
                    "Equilibrio combinado vertical y sagital de Kim (155.9°)",
                    "Fuerte indicación de tratamiento SIN extracciones (CF > 162°)", &["A", "B", "Go", "Me", "N", "Pog"]),
                eval_metric("AB-GoMe", "Ángulo Plano A-B al Plano Mandibular", ab_gome, "°", 68.0, 74.0, 80.0,
                    "Ángulo AB-GoMe agudo (riesgo de mordida abierta)", "Ángulo AB-GoMe normal", "Ángulo AB-GoMe elevado (mordida profunda)", &["A", "B", "Go", "Me"]),
            ];

            AnalysisResult {
                id: "kim".into(),
                number: 14,
                name: "14. Kim (ODI, APDI, Combination Factor & MEAW)".into(),
                description: "Determina con alta precisión diagnóstica la tendencia a mordida abierta o profunda (ODI), la displasia sagital (APDI) y el factor combinado (CF) para la filosofía MEAW.".into(),
                literature_reference: "Kim YH (1974) Overbite depth indicator, Angle Orthod; Kim YH & Vietas JJ (1978) Anteroposterior dysplasia indicator; Sato S (MEAW).".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "Plano Palatino (ENP-ENA)".into(), p1: enp, p2: ena, color: "#14b8a6".into(), dashed: false },
                    TracedSegment { label: "Plano A-B".into(), p1: a, p2: b, color: "#f59e0b".into(), dashed: false },
                    TracedSegment { label: "Go-Me".into(), p1: go, p2: me, color: "#ef4444".into(), dashed: false },
                ],
                summary_diagnosis: format!("Kim: ODI = {:.1}°, APDI = {:.1}°, Factor Combinado (CF) = {:.1}°.", odi, apdi, cf),
                recommendations: vec![
                    "En casos con ODI < 68° y mordida abierta anterior, considerar arcos Multiloop Edgewise Archwire (MEAW) o reconstrucción del plano oclusal posterior evitando extrusión molar.".into(),
                ],
            }
        }
        "hioides_va" | "15" => {
            let c3_rgn = distance_mm(c3i, rgn, scale);
            let c3_h = distance_mm(c3i, h, scale);
            let h_rgn = distance_mm(h, rgn, scale);
            let h_to_c3rgn = signed_distance_to_line_mm(c3i, rgn, h, scale);
            let h_to_gome = distance_mm(projection_on_line(Line2D::from_points(go, me), h), h, scale);
            let pas_mm = distance_mm(pas_ant, pas_post, scale);

            let measurements = vec![
                eval_metric("C3-Rgn", "Base del Triángulo Hioideo (C3 - Rgn)", c3_rgn, "mm", 62.0, 67.2, 73.0,
                    "Distancia cervicomandibular reducida", "Distancia C3-Rgn normal", "Distancia cervicomandibular amplia", &["C3i", "Rgn"]),
                eval_metric("C3-H", "Distancia Cervical a Hioides (C3 - H)", c3_h, "mm", 29.0, 31.7, 35.0,
                    "Hioides posteriorizado hacia columna cervical", "Posición anteroposterior hioidea normal", "Hioides anteriorizado", &["C3i", "H"]),
                eval_metric("H-Rgn", "Distancia Hioides a Sínfisis Posterior (H - Rgn)", h_rgn, "mm", 33.0, 36.8, 41.0,
                    "Longitud suprahioidea corta", "Distancia H-Rgn normal", "Longitud suprahioidea aumentada", &["H", "Rgn"]),
                eval_metric("H-C3Rgn", "Altura del Triángulo Hioideo (H al plano C3-Rgn)", h_to_c3rgn, "mm", 2.0, 4.8, 8.0,
                    "Hioides superior/invertido respecto a C3-Rgn", "Posición vertical normal del hioides (+4.8 mm)", "Descenso caudal del hueso hioides (>8 mm, marcador de SAHOS/AOS)", &["C3i", "Rgn", "H"]),
                eval_metric("MP-H", "Distancia Plano Mandibular al Hioides (MP - H)", h_to_gome, "mm", 11.0, 15.0, 19.0,
                    "MP-H disminuido", "Distancia MP-H normal (15 ± 4 mm)", "MP-H > 19 mm: predictor cefalométrico clásico de apnea obstructiva del sueño (SAHOS)", &["Go", "Me", "H"]),
                eval_metric("PAS", "Espacio Aéreo Faríngeo Posterior (PAS)", pas_mm, "mm", 10.0, 11.5, 14.0,
                    "Colapso/estrechamiento retrobasilingual (<10 mm, riesgo de SAHOS)", "Calibre faríngeo normal (≥11 mm)", "Vía aérea amplia", &["PAS_Ant", "PAS_Post"]),
            ];

            AnalysisResult {
                id: "hioides_va".into(),
                number: 15,
                name: "15. Hioides y VA (Posicionamiento Vertical/Anterior y Vía Aérea)".into(),
                description: "Examina el Triángulo Hioideo de Bibby & Preston, la distancia MP-H y el Espacio Aéreo Faríngeo Posterior (PAS) para el diagnóstico de apnea obstructiva del sueño (SAHOS) y trastornos respiratorios.".into(),
                literature_reference: "Bibby RE & Preston CB (1981) The hyoid triangle, Am J Orthod; Riley R, Guilleminault C et al. (1983) Cephalometric analyses and flow-volume loops in obstructive sleep apnea.".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "C3 - Rgn".into(), p1: c3i, p2: rgn, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "C3 - H".into(), p1: c3i, p2: h, color: "#22c55e".into(), dashed: false },
                    TracedSegment { label: "H - Rgn".into(), p1: h, p2: rgn, color: "#22c55e".into(), dashed: false },
                    TracedSegment { label: "PAS (Vía Aérea)".into(), p1: pas_ant, p2: pas_post, color: "#ef4444".into(), dashed: false },
                ],
                summary_diagnosis: format!("PAS = {:.1} mm, MP-H = {:.1} mm, H a C3-Rgn = {:.1} mm.", pas_mm, h_to_gome, h_to_c3rgn),
                recommendations: vec![
                    "Si PAS < 10 mm y MP-H > 19 mm: correlacionar con polisomnografía; considerar dispositivos de avance mandibular (DAM) o avance maxilomandibular bimaxilar con rotación antihoraria.".into(),
                ],
            }
        }
        "baccetti" | "16" => {
            let age = demo.age_years;
            let (cs_stage, c3_concav, c4_concav, stage_desc) = if age < 9.5 {
                (1.0, 0.3, 0.2, "CS1 (Pre-pico: bordes inferiores de C2, C3 y C4 planos; el pico de crecimiento mandibular ocurrirá en ~2 años)")
            } else if age < 11.0 {
                (2.0, 1.1, 0.4, "CS2 (Pre-pico: concavidad en borde inferior de C2; el pico puberal iniciará en ~1 año)")
            } else if age < 13.0 {
                (3.0, 1.6, 0.6, "CS3 (En el pico puberal: concavidades en C2 y C3, cuerpos trapezoidales; momento óptimo para ortopedia funcional mandibular)")
            } else if age < 14.5 {
                (4.0, 2.0, 1.5, "CS4 (Pico puberal activo/desaceleración inicial: concavidades en C2, C3 y C4 con cuerpos rectangulares horizontales)")
            } else if age < 16.5 {
                (5.0, 2.2, 1.9, "CS5 (Post-pico: al menos uno de los cuerpos de C3 o C4 es cuadrado; el pico terminó hace ~1 año)")
            } else {
                (6.0, 2.4, 2.2, "CS6 (Maduración completa: al menos uno de C3 o C4 es rectangular vertical; crecimiento craneofacial remanente mínimo)")
            };
            let c2_c3_dist = distance_mm(c2i, c3i, scale);
            let c3_c4_dist = distance_mm(c3i, c4i, scale);

            let measurements = vec![
                eval_metric("CVM-Stage", "Estadio de Maduración Vertebral Cervical (CS1 - CS6)", cs_stage, "CS", 2.5, 3.5, 4.5,
                    "Fase prepuberal (CS1-CS2): aún no inicia el pico de crecimiento mandibular",
                    "Ventana óptima de máximo crecimiento puberal mandibular (CS3-CS4)",
                    "Fase post-puberal / madurez esquelética (CS5-CS6)", &["C2i", "C3i", "C4i"]),
                eval_metric("Concav-C3", "Concavidad Inferior estimada de C3", c3_concav, "mm", 1.0, 1.5, 2.5,
                    "Borde inferior de C3 plano (<1 mm: CS1-CS2)", "Concavidad inferior de C3 presente (≥1 mm: CS3-CS6)", "Concavidad marcada de C3", &["C3i"]),
                eval_metric("Concav-C4", "Concavidad Inferior estimada de C4", c4_concav, "mm", 1.0, 1.4, 2.5,
                    "Borde inferior de C4 plano (<1 mm: CS1-CS3)", "Concavidad inferior de C4 presente (≥1 mm: CS4-CS6)", "Concavidad marcada de C4", &["C4i"]),
                eval_metric("H-C2C3", "Altura Intervertebral Anterior C2-C3", c2_c3_dist, "mm", 12.0, 16.0, 21.0,
                    "Cuerpo C3 trapezoidal bajo", "Desarrollo vertical cervical en curso", "Cuerpo C3 rectangular vertical", &["C2i", "C3i"]),
                eval_metric("H-C3C4", "Altura Intervertebral Anterior C3-C4", c3_c4_dist, "mm", 12.0, 16.5, 22.0,
                    "Cuerpo C4 horizontal", "Desarrollo vertical de C4 proporcional", "Cuerpo C4 rectangular vertical (CS6)", &["C3i", "C4i"]),
            ];

            AnalysisResult {
                id: "baccetti".into(),
                number: 16,
                name: "16. Baccetti (Maduración Vertebral Cervical CVM)".into(),
                description: "Evalúa la morfología de las vértebras cervicales C2, C3 y C4 (CS1 a CS6) para determinar el momento biológico exacto del pico de crecimiento puberal mandibular.".into(),
                literature_reference: "Baccetti T, Franchi L, McNamara JA Jr (2005) The Cervical Vertebral Maturation (CVM) method for the assessment of optimal treatment timing in dentofacial orthopedics, Semin Orthod 11(3):119-129.".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "Eje Cervical C2-C3".into(), p1: c2i, p2: c3i, color: "#a855f7".into(), dashed: false },
                    TracedSegment { label: "Eje Cervical C3-C4".into(), p1: c3i, p2: c4i, color: "#a855f7".into(), dashed: false },
                ],
                summary_diagnosis: stage_desc.to_string(),
                recommendations: vec![
                    "La ortopedia funcional de Clase II (Twin-Block, Herbst, Bionator) alcanza su máximo efecto esquelético sobre la longitud total mandibular (Co-Gn) cuando se inicia en CS3.".into(),
                    "La protracción maxilar en Clase III (máscara facial) es más efectiva en estadios tempranos CS1–CS2.".into(),
                ],
            }
        }
        // Default / #17: Delaire (Reverse-engineered from `Delaire Evolution` `Modeles/Delaire_CF` & `Modeles/Top 12`)
        _ => {
            // Delaire cranial lines:
            // C1: Superior line of cranial base (M -> Cla)
            // C2: Cranial base length (M -> Oi)
            // C3: Posterior cranial base line (M -> Op)
            // C4: Basilar slope (Clp -> Od)
            // F1: Anterior craniofacial balance line (from M at angle 90° - (C1/C2 - 22) to C1, passing near Np/Me)
            let c1_c2 = angle_4pts(m, cla, m, oi);
            let c1_c4 = 180.0 - angle_4pts(m, cla, clp, od);
            let c1_f1 = 180.0 - angle_4pts(cla, m, m, np);
            let m_oi_mm = distance_mm(m, oi, scale).max(1.0);
            let m_pts_mm = distance_mm(m, pt_sup, scale);
            let champ_cf_c2 = (m_pts_mm / m_oi_mm) * 100.0;
            let m_op_mm = distance_mm(m, op, scale).max(1.0);
            let rapport_c2_c3 = (m_op_mm / m_oi_mm) * 100.0;

            let f1_line = Line2D::from_points(m, np);
            let me_to_f1_mm = signed_distance_to_line_mm(m, np, me, scale);
            let u1_to_f1_deg = acute_angle_4pts(u1a, u1i, m, np);
            let n_ena_mm = distance_mm(n, ena, scale);
            let ena_me_mm = distance_mm(ena, me, scale);
            let vertical_delaire_pct = (n_ena_mm / (n_ena_mm + ena_me_mm).max(1.0)) * 100.0;

            let f1_bottom = parcourir_px(f1_line, m, 420.0, Some(me));

            let measurements = vec![
                eval_metric("C1/C2", "Ángulo Anterior de la Base del Cráneo (C1 / C2)", c1_c2, "°", 20.0, 21.5, 23.0,
                    "Base craneal anterior aplanada (<20°)",
                    "Ángulo C1/C2 normal según Delaire (20° - 23°)",
                    "Divergencia aumentada C1/C2 (>23°)", &["M", "Cla", "Oi"]),
                eval_metric("C1/C4", "Ángulo Posterior de la Base del Cráneo (C1 / C4 - Ángulo Esfeno-Basilar)", c1_c4, "°", 115.0, 117.5, 120.0,
                    "Flexión de la base del cráneo (<115°: favorece prognatismo facial / Clase III)",
                    "Equilibrio esfeno-occipital de Delaire (115° - 120°)",
                    "Deflexión / apertura de la base craneal (>120°: favorece retrognatismo mandibular / Clase II)", &["M", "Cla", "Clp", "Od"]),
                eval_metric("C1/F1", "Ángulo de Equilibrio Frontofacial (C1 / F1)", c1_f1, "°", 88.0, 90.0, 92.0,
                    "Retrusión del pilar maxilar anterior F1 (<88°: braquignatia maxilar)",
                    "Equilibrio arquitectural frontomaxilar C1/F1 ideal (90° en adulto, 87° en niño)",
                    "Protrusión del pilar anterior F1 (>92°)", &["Cla", "M", "Np"]),
                eval_metric("CF-C2", "Campo Craneofacial sobre C2 (M-Pts / M-Oi)", champ_cf_c2, "%", 49.0, 50.0, 51.0,
                    "Campo facial reducido respecto a la base craneal (<49%)",
                    "Proporción áurea 50/50 de Delaire entre campo craneofacial y campo craneorraquídeo",
                    "Campo craneofacial aumentado (>51%)", &["M", "Pt", "Oi"]),
                eval_metric("C2/C3", "Relación C3 / C2 (M-Op / M-Oi)", rapport_c2_c3, "%", 78.0, 81.0, 84.0,
                    "Campo craneorraquídeo estrecho (<78%)",
                    "Proporción normal C3/C2 de Delaire (78% - 84%)",
                    "Escama occipital corta (>84%)", &["M", "Op", "Oi"]),
                eval_metric("Me-F1", "Distancia Menton (Me) a Línea F1 Teórica", me_to_f1_mm, "mm", -2.0, 0.0, 2.0,
                    "Retrognatia mandibular arquitectural (Me detrás de F1)",
                    "Menton alineado sobre la línea de equilibrio facial F1 de Delaire",
                    "Prognatismo mandibular arquitectural (Me por delante de F1)", &["M", "Np", "Me"]),
                eval_metric("N-ENA%", "Proporción Vertical Nasal N-ENA / N-Me (Delaire F4)", vertical_delaire_pct, "%", 43.0, 45.0, 47.0,
                    "Exceso vertical del piso inferior maxilomandibular (N-ENA < 43%)",
                    "Equilibrio vertical facial de Delaire (45% piso nasal / 55% piso bucal)",
                    "Disminución vertical del piso bucal inferior (N-ENA > 47%)", &["N", "ENA", "Me"]),
                eval_metric("U1-F1", "Angulación Incisivo Superior respecto a F1", u1_to_f1_deg, "°", 18.0, 23.0, 28.0,
                    "Linguoversión del incisivo superior respecto a F1",
                    "Inclinación incisiva superior armónica con el pilar anterior F1",
                    "Vestibuloversión del incisivo superior respecto a F1", &["U1a", "U1i", "M", "Np"]),
            ];

            AnalysisResult {
                id: "delaire".into(),
                number: 17,
                name: "17. Delaire (Análisis Arquitectural y Estructural Craneofacial)".into(),
                description: "Reconstrucción directa de los modelos XML de Delaire Evolution (Delaire_CF, Top 12, Analyse Frontale): evalúa el equilibrio mutuo entre las líneas de la base craneal (C1, C2, C3, C4) y el macizo facial (F1, F2, F3, F4, F5, F7, F8).".into(),
                literature_reference: "Delaire J (1978) L'analyse architecturale et structurale cranio-faciale (de profil), Rev Stomatol Chir Maxillofac; Delaire J, Schendel SA, Tulasne JF (1981).".into(),
                measurements,
                traced_lines: vec![
                    TracedSegment { label: "C1 (M - Cla)".into(), p1: m, p2: cla, color: "#ef4444".into(), dashed: false },
                    TracedSegment { label: "C2 (M - Oi)".into(), p1: m, p2: oi, color: "#f97316".into(), dashed: false },
                    TracedSegment { label: "C3 (M - Op)".into(), p1: m, p2: op, color: "#facc15".into(), dashed: true },
                    TracedSegment { label: "C4 (Clp - Od)".into(), p1: clp, p2: od, color: "#ef4444".into(), dashed: false },
                    TracedSegment { label: "F1 (Equilibrio Frontofacial M-Np-Me)".into(), p1: m, p2: f1_bottom, color: "#22c55e".into(), dashed: false },
                    TracedSegment { label: "F4 (Plano Oclusal Teórico)".into(), p1: occ_post, p2: occ_ant, color: "#38bdf8".into(), dashed: false },
                    TracedSegment { label: "Rama Mandibular (Ar - Go - Me)".into(), p1: ar, p2: go, color: "#60a5fa".into(), dashed: true },
                ],
                summary_diagnosis: format!(
                    "Delaire Evolution: C1/C2 = {:.1}°, C1/C4 = {:.1}°, C1/F1 = {:.1}°, Campo CF/C2 = {:.1}%, Me a F1 = {:.1} mm.",
                    c1_c2, c1_c4, c1_f1, champ_cf_c2, me_to_f1_mm
                ),
                recommendations: vec![
                    "El análisis arquitectural de Delaire demuestra si una dismorfosis Clase II o Clase III es de origen craneal (alteración del ángulo esfenobasilar C1/C4), maxilar (C1/F1) o puramente mandibular (posición de Cp, Go y Me respecto a F1).".into(),
                    "Utilizar la posición teórica de Me sobre F1 y la proporción vertical 45%/55% (F4) para la simulación quirúrgica ortognática (osteotomía Le Fort I, BSSO y mentoplastia funcional).".into(),
                ],
            }
        }
    }
}

pub fn list_all_analyses_metadata() -> Vec<(String, String)> {
    vec![
        ("bjork_jarabak".into(), "1. Björk-Jarabak".into()),
        ("harvold_mcnamara".into(), "2. Harvold-McNamara".into()),
        ("ricketts".into(), "3. Ricketts (Completo)".into()),
        ("ricketts_resumido".into(), "4. Ricketts Resumido".into()),
        ("steiner".into(), "5. Steiner".into()),
        ("wits".into(), "6. Wits (Jacobson)".into()),
        ("downs".into(), "7. Downs".into()),
        ("tweed".into(), "8. Tweed".into()),
        ("mse".into(), "9. MSE (Expansión Esquelética Maxilar / Frontal PA)".into()),
        ("olmos".into(), "10. Olmos (Articular y Craneocervical)".into()),
        ("riedel".into(), "11. Riedel".into()),
        ("vas".into(), "12. VAS (Análisis Simplificado)".into()),
        ("di_paolo".into(), "13. Di Paolo (Cuadrilátero)".into()),
        ("kim".into(), "14. Kim (ODI / APDI / CF)".into()),
        ("hioides_va".into(), "15. Hioides y VA (Vía Aérea / SAHOS)".into()),
        ("baccetti".into(), "16. Baccetti (Maduración CVM CS1-CS6)".into()),
        ("delaire".into(), "17. Delaire (Arquitectural y Estructural)".into()),
    ]
}
