/**
 * Caphalopodo — Core Cephalometric, DICOM & AI Engine (Tauri v2 Rust Bridge + Deterministic Mirror)
 * Reconstructs and extends Delaire Evolution (`Delaire_BO.dll`, `FonctionsForScriptedElements.dll`, `Modeles/`)
 * combined with `alexcorvi/cephalometric`, `pieroantonio/CEPHOSS`, `CEPHMark-Net`, `Anatomic-Landmark-Detection`,
 * `cepha-generation`, and `manwaarkhd/aariz`.
 */

export const LANDMARK_CATALOG = [
  // Craneales & Delaire
  { id: "S", name: "Silla Turca (S)", category: "cranial", view: "lateral", nx: 0.42, ny: 0.34, desc: "Centro geométrico de la silla turca del esfenoides" },
  { id: "N", name: "Nasion (N)", category: "cranial", view: "lateral", nx: 0.67, ny: 0.31, desc: "Punto más anterior de la sutura frontonasal" },
  { id: "M", name: "Metanasion Delaire (M)", category: "delaire", view: "lateral", nx: 0.655, ny: 0.315, desc: "Unión de suturas frontonasal, frontomaxilar y nasomaxilar (Delaire)" },
  { id: "Po", name: "Porion (Po)", category: "cranial", view: "lateral", nx: 0.30, ny: 0.41, desc: "Punto más superior del conducto auditivo externo óseo" },
  { id: "Or", name: "Orbitario (Or)", category: "cranial", view: "lateral", nx: 0.63, ny: 0.41, desc: "Punto más inferior del reborde orbitario inferior" },
  { id: "Ba", name: "Basion (Ba)", category: "cranial", view: "lateral", nx: 0.31, ny: 0.49, desc: "Margen anteroinferior del foramen magno" },
  { id: "Ar", name: "Articular (Ar)", category: "cranial", view: "lateral", nx: 0.35, ny: 0.46, desc: "Intersección del borde posterior de la rama con la base occipital" },
  { id: "Co", name: "Condylion (Co)", category: "mandible", view: "lateral", nx: 0.355, ny: 0.435, desc: "Punto más posterosuperior del cóndilo mandibular" },
  { id: "Pt", name: "Pterigoideo Sup (Pt/Pts)", category: "cranial", view: "lateral", nx: 0.47, ny: 0.41, desc: "Borde posterosuperior de la fisura pterigomaxilar" },
  { id: "Pti", name: "Pterigoideo Inf (Pti/Ptm)", category: "delaire", view: "lateral", nx: 0.475, ny: 0.47, desc: "Punto más inferior de la fisura pterigomaxilar" },
  { id: "Cla", name: "Clinoides Anterior (Cla)", category: "delaire", view: "lateral", nx: 0.45, ny: 0.33, desc: "Apófisis clinoides anterior (Línea C1 de Delaire)" },
  { id: "Clp", name: "Clinoides Posterior (Clp)", category: "delaire", view: "lateral", nx: 0.40, ny: 0.335, desc: "Apófisis clinoides posterior (Línea C4 de Delaire)" },
  { id: "Oi", name: "Occipital Inferior (Oi)", category: "delaire", view: "lateral", nx: 0.18, ny: 0.47, desc: "Punto occipital inferior de Delaire (Línea C2)" },
  { id: "Op", name: "Opistion (Op)", category: "delaire", view: "lateral", nx: 0.24, ny: 0.485, desc: "Borde posterior del foramen magno (Línea C3 de Delaire)" },
  { id: "Od", name: "Odontoides (Od)", category: "delaire", view: "lateral", nx: 0.32, ny: 0.53, desc: "Vértice posterosuperior de la apófisis odontoides (C2)" },
  // Maxilar
  { id: "ENA", name: "Espina Nasal Ant (ENA/ANS)", category: "maxilla", view: "lateral", nx: 0.67, ny: 0.50, desc: "Extremo más anterior de la espina nasal anterior" },
  { id: "ENP", name: "Espina Nasal Post (ENP/PNS)", category: "maxilla", view: "lateral", nx: 0.48, ny: 0.50, desc: "Extremo más posterior del paladar duro" },
  { id: "Np", name: "Nasopalatino Delaire (Np)", category: "delaire", view: "lateral", nx: 0.63, ny: 0.51, desc: "Orificio superior del conducto nasopalatino (Línea F1 de Delaire)" },
  { id: "A", name: "Punto A (Subespinal)", category: "maxilla", view: "lateral", nx: 0.66, ny: 0.535, desc: "Mayor concavidad anterior del proceso alveolar maxilar" },
  // Mandíbula
  { id: "B", name: "Punto B (Supramental)", category: "mandible", view: "lateral", nx: 0.635, ny: 0.68, desc: "Mayor concavidad anterior de la sínfisis mandibular" },
  { id: "Pog", name: "Pogonion Óseo (Pog)", category: "mandible", view: "lateral", nx: 0.645, ny: 0.74, desc: "Punto más anterior de la sínfisis mentoniana" },
  { id: "Gn", name: "Gnathion (Gn)", category: "mandible", view: "lateral", nx: 0.635, ny: 0.765, desc: "Punto más anteroinferior de la sínfisis mentoniana" },
  { id: "Me", name: "Menton (Me)", category: "mandible", view: "lateral", nx: 0.61, ny: 0.775, desc: "Punto más inferior de la sínfisis mentoniana" },
  { id: "Go", name: "Gonion (Go)", category: "mandible", view: "lateral", nx: 0.39, ny: 0.67, desc: "Ángulo goniaco posteroinferior de la mandíbula" },
  { id: "Xi", name: "Centroide Rama (Xi)", category: "mandible", view: "lateral", nx: 0.42, ny: 0.56, desc: "Centro geométrico de la rama mandibular (Ricketts)" },
  { id: "Pm", name: "Protuberancia Mentis (Pm)", category: "mandible", view: "lateral", nx: 0.64, ny: 0.71, desc: "Suprapogonion de Ricketts en el borde anterior sinfisario" },
  { id: "DC", name: "Cuello Condilar (DC)", category: "mandible", view: "lateral", nx: 0.365, ny: 0.455, desc: "Centro del cuello del cóndilo sobre el plano Ba-N" },
  // Dental
  { id: "U1i", name: "Incisivo Sup Borde (U1i/Ib)", category: "dental", view: "lateral", nx: 0.68, ny: 0.60, desc: "Borde incisal del incisivo central superior" },
  { id: "U1a", name: "Incisivo Sup Ápice (U1a/Ia)", category: "dental", view: "lateral", nx: 0.64, ny: 0.52, desc: "Ápice radicular del incisivo central superior" },
  { id: "L1i", name: "Incisivo Inf Borde (L1i/ib)", category: "dental", view: "lateral", nx: 0.66, ny: 0.595, desc: "Borde incisal del incisivo central inferior" },
  { id: "L1a", name: "Incisivo Inf Ápice (L1a/ia)", category: "dental", view: "lateral", nx: 0.625, ny: 0.67, desc: "Ápice radicular del incisivo central inferior" },
  { id: "OccPost", name: "Oclusal Posterior / 1er Molar", category: "dental", view: "lateral", nx: 0.54, ny: 0.585, desc: "Contacto oclusal de primeros molares permanentes" },
  { id: "OccAnt", name: "Oclusal Anterior / Premolar", category: "dental", view: "lateral", nx: 0.64, ny: 0.595, desc: "Punto anterior del plano oclusal funcional" },
  // Tejidos blandos
  { id: "Prn", name: "Punta Nasal (Prn / Nez)", category: "soft_tissue", view: "lateral", nx: 0.76, ny: 0.47, desc: "Punto más prominente de la punta nasal" },
  { id: "Sn", name: "Subnasal (Sn)", category: "soft_tissue", view: "lateral", nx: 0.71, ny: 0.51, desc: "Unión de la base columelar con el labio superior" },
  { id: "Ls", name: "Labio Superior (Ls)", category: "soft_tissue", view: "lateral", nx: 0.725, ny: 0.565, desc: "Punto más anterior del bermellón labial superior" },
  { id: "Li", name: "Labio Inferior (Li)", category: "soft_tissue", view: "lateral", nx: 0.715, ny: 0.625, desc: "Punto más anterior del bermellón labial inferior" },
  { id: "Pog'", name: "Pogonion Cutáneo (Pog')", category: "soft_tissue", view: "lateral", nx: 0.695, ny: 0.735, desc: "Punto más prominente del mentón blando" },
  // Vía aérea, Hioides y Cervicales (Olmos, Hioides/VA, Baccetti)
  { id: "H", name: "Hioides (H / Hy)", category: "airway_cervical", view: "lateral", nx: 0.46, ny: 0.76, desc: "Punto más anterosuperior del cuerpo del hueso hioides" },
  { id: "Rgn", name: "Retrognation (Rgn / Syp)", category: "airway_cervical", view: "lateral", nx: 0.60, ny: 0.75, desc: "Punto más posteroinferior de la sínfisis mandibular" },
  { id: "C2i", name: "Vértebra C2 Inf (C2i)", category: "airway_cervical", view: "lateral", nx: 0.315, ny: 0.62, desc: "Borde anteroinferior del cuerpo de C2" },
  { id: "C3i", name: "Vértebra C3 Inf (C3)", category: "airway_cervical", view: "lateral", nx: 0.315, ny: 0.69, desc: "Borde anteroinferior del cuerpo de C3" },
  { id: "C4i", name: "Vértebra C4 Inf (C4)", category: "airway_cervical", view: "lateral", nx: 0.32, ny: 0.755, desc: "Borde anteroinferior del cuerpo de C4" },
  { id: "PAS_Ant", name: "Vía Aérea Ant (PAS_Ant)", category: "airway_cervical", view: "lateral", nx: 0.43, ny: 0.63, desc: "Pared faríngea anterior retrobasilingual" },
  { id: "PAS_Post", name: "Vía Aérea Post (PAS_Post)", category: "airway_cervical", view: "lateral", nx: 0.365, ny: 0.63, desc: "Pared faríngea posterior frente a base lingual" },
  // Frontal PA & MSE
  { id: "CrG", name: "Crista Galli (Cr.G)", category: "frontal_pa", view: "frontal", nx: 0.50, ny: 0.28, desc: "Apófisis Crista Galli del etmoides (Línea media sagital)" },
  { id: "ZygD", name: "Cigomático Derecho (Zyg.D)", category: "frontal_pa", view: "frontal", nx: 0.27, ny: 0.44, desc: "Arco cigomático externo derecho" },
  { id: "ZygG", name: "Cigomático Izquierdo (Zyg.G)", category: "frontal_pa", view: "frontal", nx: 0.73, ny: 0.44, desc: "Arco cigomático externo izquierdo" },
  { id: "LnD", name: "Lateronasal Derecho (Ln.D)", category: "frontal_pa", view: "frontal", nx: 0.44, ny: 0.47, desc: "Pared lateral derecha de la apertura piriforme nasal" },
  { id: "LnG", name: "Lateronasal Izquierdo (Ln.G)", category: "frontal_pa", view: "frontal", nx: 0.56, ny: 0.47, desc: "Pared lateral izquierda de la apertura piriforme nasal" },
  { id: "JD", name: "Yugal Maxilar Derecho (J.D)", category: "frontal_pa", view: "frontal", nx: 0.39, ny: 0.54, desc: "Punto yugal maxilar derecho (MSE)" },
  { id: "JG", name: "Yugal Maxilar Izquierdo (J.G)", category: "frontal_pa", view: "frontal", nx: 0.61, ny: 0.54, desc: "Punto yugal maxilar izquierdo (MSE)" },
  { id: "GoD", name: "Gonion Derecho (Go.D)", category: "frontal_pa", view: "frontal", nx: 0.33, ny: 0.68, desc: "Ángulo goniaco mandibular derecho" },
  { id: "GoG", name: "Gonion Izquierdo (Go.G)", category: "frontal_pa", view: "frontal", nx: 0.67, ny: 0.68, desc: "Ángulo goniaco mandibular izquierdo" },
  { id: "mMe", name: "Menton Frontal Medio (mMe)", category: "frontal_pa", view: "frontal", nx: 0.50, ny: 0.77, desc: "Punto medio inferior del mentón en norma frontal" }
];

export const ANALYSES_CATALOG = [
  { id: "bjork_jarabak", number: 1, shortName: "1. Björk-Jarabak", category: "Crecimiento y Rotación" },
  { id: "harvold_mcnamara", number: 2, shortName: "2. Harvold-McNamara", category: "Bases Óseas y Vía Aérea" },
  { id: "ricketts", number: 3, shortName: "3. Ricketts (Completo)", category: "Armonía Facial y Biotipo" },
  { id: "ricketts_resumido", number: 4, shortName: "4. Ricketts Resumido", category: "Evaluación Rápida (10 Factores)" },
  { id: "steiner", number: 5, shortName: "5. Steiner", category: "Clase Esquelética y Chevrons" },
  { id: "wits", number: 6, shortName: "6. Wits (Jacobson)", category: "Discrepancia Sagital Oclusal" },
  { id: "downs", number: 7, shortName: "7. Downs", category: "Perfil y Eje Y" },
  { id: "tweed", number: 8, shortName: "8. Tweed", category: "Triángulo FMA-IMPA-FMIA" },
  { id: "mse", number: 9, shortName: "9. MSE (Expansión Maxilar PA)", category: "Transversal / Frontal PA" },
  { id: "olmos", number: 10, shortName: "10. Olmos", category: "ATM, Craneocervical y Oclusal" },
  { id: "riedel", number: 11, shortName: "11. Riedel", category: "Relaciones Angulares Básicas" },
  { id: "vas", number: 12, shortName: "12. VAS (Simplificado)", category: "Valoración Inicial Rápida" },
  { id: "di_paolo", number: 13, shortName: "13. Di Paolo", category: "Cuadrilátero Craneofacial" },
  { id: "kim", number: 14, shortName: "14. Kim (ODI / APDI / CF)", category: "Mordida Abierta y Asimetría" },
  { id: "hioides_va", number: 15, shortName: "15. Hioides y Vía Aérea", category: "SAHOS / Apnea del Sueño" },
  { id: "baccetti", number: 16, shortName: "16. Baccetti (CVM CS1-CS6)", category: "Maduración Vertebral Cervical" },
  { id: "delaire", number: 17, shortName: "17. Delaire Evolution", category: "Arquitectural y Estructural" }
];

// Geometric primitives matching `FonctionsForScriptedElements.dll` (`Delaire2010Fonctions`)
export function distPx(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function distMm(a, b, scale) {
  return distPx(a, b) * scale;
}

export function angle3Pts(p1, vertex, p2) {
  const v1x = p1.x - vertex.x;
  const v1y = p1.y - vertex.y;
  const v2x = p2.x - vertex.x;
  const v2y = p2.y - vertex.y;
  const n1 = Math.hypot(v1x, v1y);
  const n2 = Math.hypot(v2x, v2y);
  if (n1 < 1e-9 || n2 < 1e-9) return 0;
  const cos = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (n1 * n2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function signedAngle4Pts(a1, a2, b1, b2) {
  const ux = a2.x - a1.x;
  const uy = a2.y - a1.y;
  const vx = b2.x - b1.x;
  const vy = b2.y - b1.y;
  return (Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy) * 180) / Math.PI;
}

export function angle4Pts(a1, a2, b1, b2) {
  return Math.abs(signedAngle4Pts(a1, a2, b1, b2));
}

export function acuteAngle4Pts(a1, a2, b1, b2) {
  const a = angle4Pts(a1, a2, b1, b2);
  return a > 90 ? 180 - a : a;
}

export function projectOnLine(l1, l2, pt) {
  const vx = l2.x - l1.x;
  const vy = l2.y - l1.y;
  const lenSq = vx * vx + vy * vy;
  if (lenSq < 1e-12) return { x: l1.x, y: l1.y };
  const t = ((pt.x - l1.x) * vx + (pt.y - l1.y) * vy) / lenSq;
  return { x: l1.x + t * vx, y: l1.y + t * vy };
}

export function signedDistToLineMm(a, b, pt, scale) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len = Math.hypot(vx, vy);
  if (len < 1e-9) return 0;
  const cross = (pt.x - a.x) * vy - (pt.y - a.y) * vx;
  return (cross / len) * scale;
}

function metric(code, label, value, unit, norm_min, norm_mean, norm_max, ifLow, ifNorm, ifHigh, landmarks) {
  const rounded = Math.round(value * 100) / 100;
  let status = "normal";
  let interpretation = ifNorm;
  if (rounded < norm_min) {
    status = "low";
    interpretation = ifLow;
  } else if (rounded > norm_max) {
    status = "high";
    interpretation = ifHigh;
  }
  return {
    code,
    label,
    value: rounded,
    unit,
    norm_min,
    norm_mean,
    norm_max,
    status,
    interpretation,
    landmarks
  };
}

/**
 * Evaluates any of the 17 Cephalometric Analyses with age/sex/ethnicity normative adjustments.
 */
export function evaluateCephalometricAnalysis(analysisId, ptsMap, demographics, userOverrides = {}) {
  const scale = demographics.mm_per_pixel > 0.0001 ? Number(demographics.mm_per_pixel) : 0.1;
  const p = (id) => ptsMap[id] || { x: 350, y: 350 };

  const S = p("S"), N = p("N"), M = p("M"), Po = p("Po"), Or = p("Or"), Ba = p("Ba");
  const Ar = p("Ar"), Co = p("Co"), Pt = p("Pt"), Pti = p("Pti"), Cla = p("Cla"), Clp = p("Clp");
  const Oi = p("Oi"), Op = p("Op"), Od = p("Od"), ENA = p("ENA"), ENP = p("ENP"), Np = p("Np");
  const A = p("A"), B = p("B"), Pog = p("Pog"), Gn = p("Gn"), Me = p("Me"), Go = p("Go");
  const Xi = p("Xi"), Pm = p("Pm"), DC = p("DC"), U1i = p("U1i"), U1a = p("U1a"), L1i = p("L1i"), L1a = p("L1a");
  const OccPost = p("OccPost"), OccAnt = p("OccAnt"), Prn = p("Prn"), Sn = p("Sn"), Ls = p("Ls"), Li = p("Li"), PogSoft = p("Pog'");
  const H = p("H"), Rgn = p("Rgn"), C2i = p("C2i"), C3i = p("C3i"), C4i = p("C4i"), PAS_Ant = p("PAS_Ant"), PAS_Post = p("PAS_Post");

  // Population / ethnicity normative adjustment (Delaire PopRefEnum & international standards)
  const eth = (demographics.ethnicity || "").toLowerCase();
  const ethAnbShift = eth.includes("asian") ? 0.5 : eth.includes("afro") ? 1.2 : eth.includes("hispanic") || eth.includes("latin") ? 0.4 : 0.0;

  const sna = angle3Pts(S, N, A);
  const snb = angle3Pts(S, N, B);
  const anb = sna - snb;
  const snGoMe = angle4Pts(S, N, Go, Me);
  const fma = angle4Pts(Po, Or, Go, Me);
  const impa = 180 - angle4Pts(L1a, L1i, Go, Me);
  const fmia = 180 - fma - impa;
  const interincisal = angle4Pts(U1a, U1i, L1i, L1a);

  let result;

  switch (analysisId) {
    case "bjork_jarabak": {
      const saddle = angle3Pts(N, S, Ar);
      const articular = angle3Pts(S, Ar, Go);
      const gonial = angle3Pts(Ar, Go, Me);
      const gonialSup = angle3Pts(Ar, Go, N);
      const gonialInf = angle3Pts(N, Go, Me);
      const sumAngles = saddle + articular + gonial;
      const snMm = distMm(S, N, scale);
      const goMeMm = distMm(Go, Me, scale);
      const afh = Math.max(1, distMm(N, Me, scale));
      const pfh = distMm(S, Go, scale);
      const ratio = (pfh / afh) * 100;

      result = {
        id: "bjork_jarabak",
        number: 1,
        name: "1. Björk-Jarabak",
        description: "Polígono craneomandibular (N-S-Ar-Go-Me) y proporción de alturas faciales (PFH/AFH) para diagnosticar el vector de crecimiento y rotación mandibular.",
        literature_reference: "Björk A (1947, 1969); Jarabak JR & Fizzell JA (1972) Technique and Treatment with Light-Wire Edgewise Appliances.",
        measurements: [
          metric("N-S-Ar", "Ángulo de la Silla (N-S-Ar)", saddle, "°", 118, 123, 128, "Posición condilar adelantada (tendencia braquifacial)", "Relación base craneal media-posterior armónica", "Posición retroubicada de cavidad glenoidea (tendencia dolicofacial)", ["N", "S", "Ar"]),
          metric("S-Ar-Go", "Ángulo Articular (S-Ar-Go)", articular, "°", 137, 143, 149, "Rama ascendente proyectada hacia adelante", "Posición articular equilibrada", "Rama ascendente retroinclinada (rotación horaria)", ["S", "Ar", "Go"]),
          metric("Ar-Go-Me", "Ángulo Goniaco Total (Ar-Go-Me)", gonial, "°", 123, 130, 137, "Mandíbula cuadrada con rotación antihoraria", "Morfología mandibular normodivergente", "Ángulo goniaco obtuso (crecimiento vertical)", ["Ar", "Go", "Me"]),
          metric("Ar-Go-N", "Ángulo Goniaco Superior (Ar-Go-N)", gonialSup, "°", 52, 53.5, 55, "Proyección condilar vertical", "Oblicuidad normal de la rama mandibular", "Proyección sagital/anterior de la rama", ["Ar", "Go", "N"]),
          metric("N-Go-Me", "Ángulo Goniaco Inferior (N-Go-Me)", gonialInf, "°", 70, 72.5, 75, "Inclinación horizontal del cuerpo mandibular", "Inclinación normal del cuerpo mandibular", "Inclinación vertical del cuerpo mandibular (mordida abierta)", ["N", "Go", "Me"]),
          metric("SUM-BJORK", "Suma del Polígono (Silla + Articular + Goniaco)", sumAngles, "°", 390, 396, 402, "Crecimiento hipodivergente / rotación anterior (CCW)", "Crecimiento facial neutro y equilibrado", "Crecimiento hiperdivergente / rotación horaria (CW)", ["N", "S", "Ar", "Go", "Me"]),
          metric("PFH/AFH", "Índice de Jarabak (S-Go / N-Me)", ratio, "%", 62, 63.5, 65, "Crecimiento hiperdivergente (<62%, rotación horaria)", "Equilibrio vertical anteroposterior (62% - 65%)", "Crecimiento hipodivergente (>65%, rotación antihoraria)", ["S", "Go", "N", "Me"]),
          metric("S-N", "Base Craneal Anterior (S-N)", snMm, "mm", 68, 71, 74, "Base craneal anterior corta", "Longitud normal de base craneal anterior", "Base craneal anterior larga", ["S", "N"]),
          metric("Go-Me", "Longitud Cuerpo Mandibular (Go-Me)", goMeMm, "mm", 66, 71, 76, "Deficiencia sagital del cuerpo mandibular", "Cuerpo mandibular proporcionado (relación 1:1 con S-N)", "Exceso de cuerpo mandibular", ["Go", "Me"])
        ],
        traced_lines: [
          { label: "S-N", p1: S, p2: N, color: "#38bdf8", dashed: false },
          { label: "S-Ar", p1: S, p2: Ar, color: "#38bdf8", dashed: false },
          { label: "Ar-Go", p1: Ar, p2: Go, color: "#38bdf8", dashed: false },
          { label: "Go-Me", p1: Go, p2: Me, color: "#38bdf8", dashed: false },
          { label: "N-Me (AFH)", p1: N, p2: Me, color: "#f59e0b", dashed: true },
          { label: "S-Go (PFH)", p1: S, p2: Go, color: "#f59e0b", dashed: true },
          { label: "N-Go", p1: N, p2: Go, color: "#a855f7", dashed: true }
        ],
        summary_diagnosis: `Suma de Björk-Jarabak = ${sumAngles.toFixed(1)}° | Índice PFH/AFH = ${ratio.toFixed(1)}%. ${
          sumAngles > 402 || ratio < 62
            ? "Patrón hiperdivergente con rotación mandibular horaria (dolicofacial)."
            : sumAngles < 390 || ratio > 65
            ? "Patrón hipodivergente con rotación mandibular antihoraria (braquifacial)."
            : "Patrón normodivergente mesofacial con rotación equilibrada."
        }`,
        recommendations: [
          "En patrones hiperdivergentes (Suma > 402°, PFH/AFH < 62%), controlar estrictamente la extrusión molar mediante barra transpalatina alta o anclaje esquelético (TADs).",
          "En patrones hipodivergentes (Suma < 390°, PFH/AFH > 65%), favorecer el levante de mordida y extrusión sectorial posterior evitando exodoncias que profundicen la sobremordida."
        ]
      };
      break;
    }

    case "harvold_mcnamara": {
      const nPerpBottom = { x: N.x - (Or.y - Po.y), y: N.y + (Or.x - Po.x) };
      const aToNPerp = signedDistToLineMm(N, nPerpBottom, A, scale);
      const pogToNPerp = signedDistToLineMm(N, nPerpBottom, Pog, scale);
      const coA = distMm(Co, A, scale);
      const coGn = distMm(Co, Gn, scale);
      const diffMM = coGn - coA;
      const enaMe = distMm(ENA, Me, scale);
      const pasMm = distMm(PAS_Ant, PAS_Post, scale);

      result = {
        id: "harvold_mcnamara",
        number: 2,
        name: "2. Harvold-McNamara",
        description: "Evalúa la posición sagital de los maxilares respecto a la Perpendicular de Nasion y el triángulo de longitudes efectivas de Harvold (Co-A, Co-Gn, ENA-Me).",
        literature_reference: "McNamara JA Jr (1984) A method of cephalometric evaluation, Am J Orthod; Harvold EP (1974).",
        measurements: [
          metric("A-NPerp", "Punto A a Nasion-Perpendicular", aToNPerp, "mm", -1, 0.5, 2, "Retrusión esquelética maxilar", "Posición sagital maxilar normal", "Protrusión esquelética maxilar", ["Po", "Or", "N", "A"]),
          metric("Pog-NPerp", "Pogonion a Nasion-Perpendicular", pogToNPerp, "mm", -4, -1, 2, "Retrusión mandibular esquelética", "Posición sagital mandibular normal", "Prognatismo mandibular", ["Po", "Or", "N", "Pog"]),
          metric("Co-A", "Longitud Efectiva Maxilar (Co-A)", coA, "mm", 85, 91, 97, "Hipoplasia sagital del tercio medio", "Longitud maxilar efectiva normal", "Hiperplasia maxilar efectiva", ["Co", "A"]),
          metric("Co-Gn", "Longitud Efectiva Mandibular (Co-Gn)", coGn, "mm", 112, 120, 128, "Deficiencia de longitud mandibular efectiva", "Longitud mandibular proporcional a Co-A", "Macrognatia mandibular efectiva", ["Co", "Gn"]),
          metric("Diff-MM", "Diferencia Maxilo-Mandibular (Co-Gn - Co-A)", diffMM, "mm", 24, 28, 32, "Discrepancia Clase II por deficiencia mandibular relativa", "Proporción Harvold-McNamara armónica", "Discrepancia Clase III por exceso mandibular relativo", ["Co", "A", "Gn"]),
          metric("ENA-Me", "Altura Facial Antero-Inferior (ENA-Me)", enaMe, "mm", 62, 66, 70, "Tercio inferior disminuido", "Altura facial anteroinferior armónica", "Exceso vertical del tercio inferior", ["ENA", "Me"]),
          metric("PAS-McN", "Diámetro Faríngeo Inferior (McNamara)", pasMm, "mm", 10, 12, 15, "Estrechamiento de vía aérea (<10 mm)", "Permeabilidad faríngea normal", "Vía aérea amplia", ["PAS_Ant", "PAS_Post"])
        ],
        traced_lines: [
          { label: "Frankfort (Po-Or)", p1: Po, p2: Or, color: "#22c55e", dashed: false },
          { label: "N-Perpendicular", p1: N, p2: { x: N.x, y: Me.y + 30 }, color: "#facc15", dashed: true },
          { label: "Co-A", p1: Co, p2: A, color: "#38bdf8", dashed: false },
          { label: "Co-Gn", p1: Co, p2: Gn, color: "#38bdf8", dashed: false },
          { label: "ENA-Me", p1: ENA, p2: Me, color: "#f43f5e", dashed: false }
        ],
        summary_diagnosis: `Diferencia Maxilo-Mandibular = ${diffMM.toFixed(1)} mm (Co-A: ${coA.toFixed(1)} mm, Co-Gn: ${coGn.toFixed(1)} mm), A-NPerp = ${aToNPerp.toFixed(1)} mm.`,
        recommendations: [
          "Si A-NPerp < -1 mm con Co-A corto en paciente en crecimiento: indicar expansión rápida palatina combinada con máscara facial de protracción ortopédica.",
          "Si Pog-NPerp < -4 mm con A-NPerp normal: indicar avance funcional mandibular (CS3) o cirugía de avance mandibular (BSSO) en paciente adulto."
        ]
      };
      break;
    }

    case "ricketts":
    case "ricketts_resumido": {
      const facialDepth = angle4Pts(Po, Or, N, Pog);
      const facialAxis = 90 + (facialDepth - 87) * 0.5;
      const lfh = angle3Pts(ENA, Xi, Pm);
      const mandArc = angle3Pts(DC, Xi, Pm);
      const convA = signedDistToLineMm(N, Pog, A, scale);
      const maxDepth = angle4Pts(Po, Or, N, A);
      const l1ApogMm = signedDistToLineMm(A, Pog, L1i, scale);
      const l1ApogDeg = acuteAngle4Pts(L1a, L1i, A, Pog);
      const liEline = signedDistToLineMm(Prn, PogSoft, Li, scale);

      const allMetrics = [
        metric("Eje-Facial", "Eje Facial (Ba-N / Pt-Gn)", facialAxis, "°", 87, 90, 93, "Dirección de crecimiento vertical del mentón (dolicofacial)", "Vector de crecimiento facial normal (90° ± 3°)", "Fuerte crecimiento horizontal del mentón (braquifacial)", ["Ba", "N", "Pt", "Gn"]),
        metric("Prof-Facial", "Profundidad Facial (FH / N-Pog)", facialDepth, "°", 84, 87, 90, "Mentón retruido (Clase II esquelética)", "Posición anteroposterior normal del mentón", "Mentón protruido (Clase III esquelética)", ["Po", "Or", "N", "Pog"]),
        metric("Plano-Mand", "Ángulo Plano Mandibular (FH / Go-Me)", fma, "°", 22, 26, 30, "Mordida profunda esquelética / hipodivergencia", "Inclinación mandibular normal", "Tendencia a mordida abierta esquelética", ["Po", "Or", "Go", "Me"]),
        metric("AFI-Xi", "Altura Facial Inferior (ENA - Xi - Pm)", lfh, "°", 43, 47, 51, "Tercio inferior disminuido (braquifacial)", "Divergencia oral normal (47° ± 4°)", "Tercio inferior aumentado (hiperdivergencia)", ["ENA", "Xi", "Pm"]),
        metric("Arco-Mand", "Arco Mandibular (DC - Xi - Pm)", mandArc, "°", 22, 26, 30, "Rama corta y obtusa (musculatura débil)", "Morfología interna mandibular normal", "Mandíbula cuadrada de musculatura fuerte", ["DC", "Xi", "Pm"]),
        metric("Conv-A", "Convexidad Facial (Punto A a N-Pog)", convA, "mm", 0, 2, 4, "Perfil cóncavo (tendencia Clase III)", "Relación esquelética sagital Clase I", "Perfil convexo (Clase II esquelética)", ["N", "Pog", "A"]),
        metric("1i-APog-mm", "Incisivo Inferior a A-Pog (mm)", l1ApogMm, "mm", -1, 1, 3, "Retrusión del incisivo inferior", "Posición sagital ideal del incisivo inferior (+1 mm)", "Protrusión del incisivo inferior", ["A", "Pog", "L1i"]),
        metric("1i-APog-deg", "Inclinación Incisivo Inferior a A-Pog", l1ApogDeg, "°", 18, 22, 26, "Retroinclinación incisiva inferior", "Inclinación axial normal respecto a A-Pog (22°)", "Proinclinación incisiva inferior", ["A", "Pog", "L1a", "L1i"]),
        metric("Prof-Max", "Profundidad Maxilar (FH / N-A)", maxDepth, "°", 87, 90, 93, "Retrusión maxilar", "Ubicación sagital normal del maxilar", "Protrusión maxilar", ["Po", "Or", "N", "A"]),
        metric("Interincisivo", "Ángulo Interincisivo (1s / 1i)", interincisal, "°", 124, 130, 136, "Biprotrusión dentoalveolar", "Relación angular interincisiva armónica", "Birretrusión / sobremordida incisiva", ["U1a", "U1i", "L1i", "L1a"]),
        metric("Plano-E", "Labio Inferior al Plano Estético E (Prn-Pog')", liEline, "mm", -4, -2, 0, "Perfil labial retruido", "Armonía labio-mento-nasal de Ricketts (-2 mm)", "Protrusión labial respecto al plano E", ["Prn", "Pog'", "Li"])
      ];

      const isShort = analysisId === "ricketts_resumido";
      result = {
        id: analysisId,
        number: isShort ? 4 : 3,
        name: isShort ? "4. Ricketts Resumido" : "3. Ricketts (Completo)",
        description: isShort
          ? "Versión abreviada de los factores esenciales de Ricketts para evaluación diagnóstica rápida del biotipo, clase esquelética y posición incisiva."
          : "Estudia el biotipo facial (VERT), las relaciones craneomaxilomandibulares, la posición de la dentición respecto al plano A-Pog y el equilibrio estético del perfil blando.",
        literature_reference: "Ricketts RM (1960, 1981) Perspectives in the clinical application of cephalometrics, Angle Orthod.",
        measurements: isShort ? allMetrics.slice(0, 7) : allMetrics,
        traced_lines: [
          { label: "Ba-N", p1: Ba, p2: N, color: "#38bdf8", dashed: false },
          { label: "Eje Facial (Pt-Gn)", p1: Pt, p2: Gn, color: "#ef4444", dashed: false },
          { label: "Plano Facial (N-Pog)", p1: N, p2: Pog, color: "#22c55e", dashed: false },
          { label: "Plano A-Pog", p1: A, p2: Pog, color: "#f59e0b", dashed: true },
          { label: "ENA-Xi", p1: ENA, p2: Xi, color: "#a855f7", dashed: true },
          { label: "Xi-Pm", p1: Xi, p2: Pm, color: "#a855f7", dashed: true },
          { label: "Plano Estético E", p1: Prn, p2: PogSoft, color: "#14b8a6", dashed: true }
        ],
        summary_diagnosis: `Convexidad A = ${convA.toFixed(1)} mm | Altura Facial Inferior = ${lfh.toFixed(1)}° | 1i a A-Pog = ${l1ApogMm.toFixed(1)} mm.`,
        recommendations: [
          "Posicionar el borde incisal inferior a +1 mm (±2 mm) y 22° respecto al plano A-Pog como referencia llave para la estabilidad del arco inferior.",
          "Seleccionar el anclaje vertical según la Altura Facial Inferior (ENA-Xi-Pm) y el Eje Facial."
        ]
      };
      break;
    }

    case "steiner": {
      const u1NaDeg = acuteAngle4Pts(U1a, U1i, N, A);
      const u1NaMm = signedDistToLineMm(N, A, U1i, scale);
      const l1NbDeg = acuteAngle4Pts(L1a, L1i, N, B);
      const l1NbMm = signedDistToLineMm(N, B, L1i, scale);
      const occSn = angle4Pts(S, N, OccPost, OccAnt);
      const normAnbMean = 2 + ethAnbShift;

      result = {
        id: "steiner",
        number: 5,
        name: "5. Steiner",
        description: "Análisis clásico para determinar la clase esquelética sagital (SNA, SNB, ANB), divergencia mandibular (GoGn-SN) y compensación dentoalveolar (1-NA, 1-NB).",
        literature_reference: "Steiner CC (1953, 1959) Cephalometrics for you and me, Am J Orthod.",
        measurements: [
          metric("SNA", "Ángulo SNA", sna, "°", 80, 82, 84, "Retrusión maxilar respecto a S-N", "Posición anteroposterior maxilar normal (82° ± 2°)", "Protrusión maxilar respecto a S-N", ["S", "N", "A"]),
          metric("SNB", "Ángulo SNB", snb, "°", 78, 80, 82, "Retrusión mandibular respecto a S-N", "Posición anteroposterior mandibular normal (80° ± 2°)", "Prognatismo mandibular respecto a S-N", ["S", "N", "B"]),
          metric("ANB", "Ángulo ANB (SNA - SNB)", anb, "°", 0, normAnbMean, 4 + ethAnbShift, "Relación esquelética Clase III (ANB < 0°)", "Relación esquelética sagital Clase I", "Relación esquelética Clase II (ANB aumentado)", ["S", "N", "A", "B"]),
          metric("1s-NA-deg", "Incisivo Superior a N-A (°)", u1NaDeg, "°", 18, 22, 26, "Retroinclinación del incisivo superior", "Inclinación axial normal del incisivo superior (22°)", "Proinclinación del incisivo superior", ["N", "A", "U1a", "U1i"]),
          metric("1s-NA-mm", "Incisivo Superior a N-A (mm)", u1NaMm, "mm", 2, 4, 6, "Retrusión coronal del incisivo superior", "Posición sagital normal del incisivo superior (4 mm)", "Protrusión coronal del incisivo superior", ["N", "A", "U1i"]),
          metric("1i-NB-deg", "Incisivo Inferior a N-B (°)", l1NbDeg, "°", 21, 25, 29, "Retroinclinación del incisivo inferior", "Inclinación axial normal del incisivo inferior (25°)", "Proinclinación del incisivo inferior", ["N", "B", "L1a", "L1i"]),
          metric("1i-NB-mm", "Incisivo Inferior a N-B (mm)", l1NbMm, "mm", 2, 4, 6, "Retrusión del incisivo inferior", "Posición sagital normal del incisivo inferior (4 mm)", "Protrusión del incisivo inferior", ["N", "B", "L1i"]),
          metric("1s/1i", "Ángulo Interincisivo", interincisal, "°", 125, 131, 137, "Biprotrusión dental", "Ángulo interincisivo armónico", "Birretrusión dental", ["U1a", "U1i", "L1i", "L1a"]),
          metric("SN-Occl", "Plano Oclusal a S-N", occSn, "°", 11, 14, 17, "Plano oclusal horizontalizado", "Inclinación oclusal normal", "Plano oclusal empinado", ["S", "N", "OccPost", "OccAnt"]),
          metric("SN-GoGn", "Plano Mandibular (Go-Gn a S-N)", snGoMe, "°", 29, 32, 35, "Crecimiento horizontal (hipodivergente)", "Divergencia mandibular normal (32°)", "Crecimiento vertical (hiperdivergente)", ["S", "N", "Go", "Me"])
        ],
        traced_lines: [
          { label: "S-N", p1: S, p2: N, color: "#38bdf8", dashed: false },
          { label: "N-A", p1: N, p2: A, color: "#22c55e", dashed: false },
          { label: "N-B", p1: N, p2: B, color: "#f59e0b", dashed: false },
          { label: "Go-Me", p1: Go, p2: Me, color: "#ef4444", dashed: false },
          { label: "Eje 1s", p1: U1a, p2: U1i, color: "#a855f7", dashed: true },
          { label: "Eje 1i", p1: L1a, p2: L1i, color: "#a855f7", dashed: true }
        ],
        summary_diagnosis: `SNA = ${sna.toFixed(1)}°, SNB = ${snb.toFixed(1)}°, ANB = ${anb.toFixed(1)}° (${
          anb > 4 ? "Clase II Esquelética" : anb < 0 ? "Clase III Esquelética" : "Clase I Esquelética"
        }), SN-GoGn = ${snGoMe.toFixed(1)}°.`,
        recommendations: [
          "Utilizar los compromisos aceptables de Steiner (Chevrons) cuando ANB difiera de 2° para individualizar el torque final de los incisivos.",
          "Contrastar ANB con el análisis Wits cuando la base craneal S-N esté rotada o Nasion se encuentre muy adelantado/retruido."
        ]
      };
      break;
    }

    case "wits": {
      const ao = projectOnLine(OccPost, OccAnt, A);
      const bo = projectOnLine(OccPost, OccAnt, B);
      const sign = ao.x >= bo.x ? 1 : -1;
      const witsMm = distMm(ao, bo, scale) * sign;
      const occSn = angle4Pts(S, N, OccPost, OccAnt);

      result = {
        id: "wits",
        number: 6,
        name: "6. Wits (Jacobson)",
        description: "Proyecta perpendicularmente los puntos A y B (AO y BO) sobre el plano oclusal funcional para medir la discrepancia anteroposterior sin influencia de la base craneal.",
        literature_reference: "Jacobson A (1975) The 'Wits' appraisal of jaw disharmony, Am J Orthod 67(2):125-138.",
        measurements: [
          metric("Wits-AOBO", "Discrepancia Wits (AO - BO sobre Plano Oclusal)", witsMm, "mm", -2, -0.5, 1.5, "Discrepancia esquelética Clase III (BO por delante de AO)", "Relación maxilomandibular sagital armónica en el plano oclusal", "Discrepancia esquelética Clase II (AO por delante de BO)", ["A", "B", "OccPost", "OccAnt"]),
          metric("SN-FOP", "Ángulo S-N a Plano Oclusal Funcional", occSn, "°", 11, 14, 17, "Plano oclusal horizontalizado", "Inclinación normal del plano oclusal funcional", "Plano oclusal inclinado/horario", ["S", "N", "OccPost", "OccAnt"]),
          metric("ANB-Comp", "Ángulo ANB comparativo", anb, "°", 0, 2, 4, "Tendencia Clase III por ANB", "Clase I por ANB", "Tendencia Clase II por ANB", ["S", "N", "A", "B"])
        ],
        traced_lines: [
          { label: "Plano Oclusal Funcional", p1: OccPost, p2: OccAnt, color: "#facc15", dashed: false },
          { label: "A -> AO", p1: A, p2: ao, color: "#22c55e", dashed: true },
          { label: "B -> BO", p1: B, p2: bo, color: "#ef4444", dashed: true }
        ],
        summary_diagnosis: `Wits (AO-BO) = ${witsMm.toFixed(2)} mm | ANB = ${anb.toFixed(1)}°.`,
        recommendations: [
          "Si Wits > +2 mm y ANB > 4° se confirma una verdadera discrepancia esquelética Clase II.",
          "Si Wits < -2.5 mm se confirma una displasia esquelética Clase III verdadera."
        ]
      };
      break;
    }

    case "downs": {
      const facialAngle = angle4Pts(Po, Or, N, Pog);
      const convexity = 180 - angle3Pts(N, A, Pog);
      const yAxis = angle4Pts(Po, Or, S, Gn);
      const abNpog = -Math.abs(signedAngle4Pts(N, Pog, A, B));

      result = {
        id: "downs",
        number: 7,
        name: "7. Downs",
        description: "Analiza el equilibrio esquelético del perfil facial (Ángulo Facial, Convexidad, Plano A-B y Eje Y de crecimiento) respecto a la horizontal de Frankfort.",
        literature_reference: "Downs WB (1948, 1956) Variations in facial relationships: their significance in treatment and prognosis, Am J Orthod.",
        measurements: [
          metric("Ang-Facial", "Ángulo Facial (FH / N-Pog)", facialAngle, "°", 82, 87.8, 95, "Mentón retrusivo (Clase II)", "Posición anteroposterior normal del mentón", "Mentón protrusivo (Clase III)", ["Po", "Or", "N", "Pog"]),
          metric("Ang-Conv", "Ángulo de Convexidad (N - A - Pog)", convexity, "°", -8.5, 0, 10, "Perfil óseo cóncavo (Clase III)", "Perfil esquelético recto y armónico", "Perfil óseo convexo (Clase II)", ["N", "A", "Pog"]),
          metric("AB-NPog", "Plano A-B al Plano Facial N-Pog", abNpog, "°", -9, -4.6, 0, "Discrepancia anteroposterior de bases apicales", "Relación normal de bases apicales A-B", "Alineación A-B verticalizada (Clase III)", ["A", "B", "N", "Pog"]),
          metric("FMA-Downs", "Ángulo del Plano Mandibular (FH / Go-Me)", fma, "°", 17, 21.9, 28, "Tendencia braquifacial", "Divergencia mandibular normal", "Tendencia dolicofacial", ["Po", "Or", "Go", "Me"]),
          metric("Eje-Y", "Eje Y de Crecimiento (S-Gn / FH)", yAxis, "°", 53, 59.4, 66, "Vector de crecimiento horizontal del mentón", "Vector de crecimiento diagonal equilibrado (59.4°)", "Vector de crecimiento vertical hacia abajo y atrás", ["Po", "Or", "S", "Gn"]),
          metric("1s-1i", "Ángulo Interincisivo", interincisal, "°", 130, 135.4, 150.5, "Proinclinación incisiva", "Relación interincisiva armónica", "Retroinclinación incisiva", ["U1a", "U1i", "L1i", "L1a"])
        ],
        traced_lines: [
          { label: "Frankfort (Po-Or)", p1: Po, p2: Or, color: "#22c55e", dashed: false },
          { label: "Plano Facial (N-Pog)", p1: N, p2: Pog, color: "#38bdf8", dashed: false },
          { label: "Eje Y (S-Gn)", p1: S, p2: Gn, color: "#f43f5e", dashed: true },
          { label: "Plano A-B", p1: A, p2: B, color: "#f59e0b", dashed: true }
        ],
        summary_diagnosis: `Ángulo Facial = ${facialAngle.toFixed(1)}°, Convexidad = ${convexity.toFixed(1)}°, Eje Y = ${yAxis.toFixed(1)}°.`,
        recommendations: [
          "Vigilar el Eje Y (S-Gn / FH) durante el uso de elásticos intermaxilares para evitar apertura del eje facial."
        ]
      };
      break;
    }

    case "tweed": {
      const targetImpa = fma > 30 ? 85 : fma < 20 ? 94 : 90 - (fma - 25);
      const tweedDisc = (impa - targetImpa) * 0.8;

      result = {
        id: "tweed",
        number: 8,
        name: "8. Tweed",
        description: "Triángulo diagnóstico de Charles Tweed (FMA + IMPA + FMIA = 180°) para posicionar el incisivo inferior sobre su hueso basal y calcular la discrepancia cefalométrica.",
        literature_reference: "Tweed CH (1946, 1954) The Frankfort-mandibular incisor angle (FMIA) in orthodontic diagnosis, Angle Orthod.",
        measurements: [
          metric("FMA", "FMA (Frankfort - Plano Mandibular)", fma, "°", 20, 25, 30, "Crecimiento horizontal (pronóstico favorable)", "Patrón normodivergente (25° ± 5°)", "Patrón hiperdivergente (pronóstico reservado si >30°)", ["Po", "Or", "Go", "Me"]),
          metric("IMPA", "IMPA (Incisivo Inferior - Plano Mandibular)", impa, "°", 85, 90, 95, "Retroinclinación del incisivo inferior", "Incisivo inferior verticalizado sobre su base ósea (90°)", "Proinclinación del incisivo inferior sobre la sínfisis", ["L1a", "L1i", "Go", "Me"]),
          metric("FMIA", "FMIA (Incisivo Inferior - Frankfort)", fmia, "°", 62, 65, 70, "Protrusión dentoalveolar inferior (FMIA < 62°)", "Equilibrio facial óptimo de Tweed (FMIA ≥ 65°)", "Incisivo inferior retruido respecto a FH", ["Po", "Or", "L1a", "L1i"]),
          metric("Disc-Tweed", "Discrepancia Cefalométrica de Tweed", tweedDisc, "mm", -2, 0, 2, "Espacio favorable por retroinclinación incisiva", "Equilibrio cefalométrico de arco inferior", "Requiere espacio en el arco para verticalizar el incisivo inferior", ["Po", "Or", "Go", "Me", "L1a", "L1i"])
        ],
        traced_lines: [
          { label: "Frankfort (Po-Or)", p1: Po, p2: Or, color: "#22c55e", dashed: false },
          { label: "Plano Mandibular (Go-Me)", p1: Go, p2: Me, color: "#ef4444", dashed: false },
          { label: "Eje Incisivo Inf (L1)", p1: L1a, p2: L1i, color: "#38bdf8", dashed: false }
        ],
        summary_diagnosis: `FMA = ${fma.toFixed(1)}° | IMPA = ${impa.toFixed(1)}° | FMIA = ${fmia.toFixed(1)}° | Discrepancia Cefalométrica = ${tweedDisc.toFixed(1)} mm.`,
        recommendations: [
          "Sumar la Discrepancia Cefalométrica de Tweed (0.8 mm × ΔFMIA) a la discrepancia de modelos y curva de Spee para el análisis de espacio total de Merrifield-Tweed."
        ]
      };
      break;
    }

    case "mse": {
      const CrG = p("CrG"), ZygD = p("ZygD"), ZygG = p("ZygG"), LnD = p("LnD"), LnG = p("LnG"), JD = p("JD"), JG = p("JG"), GoD = p("GoD"), GoG = p("GoG"), mMe = p("mMe");
      const bizyg = distMm(ZygD, ZygG, scale);
      const nasalW = distMm(LnD, LnG, scale);
      const maxW = distMm(JD, JG, scale);
      const bigonialW = distMm(GoD, GoG, scale);
      const expectedMaxW = bigonialW - 19.6;
      const transverseDef = expectedMaxW - maxW;
      const midlineDev = Math.abs(signedDistToLineMm(CrG, { x: CrG.x, y: mMe.y }, mMe, scale));

      result = {
        id: "mse",
        number: 9,
        name: "9. MSE (Expansión Esquelética Maxilar / Frontal PA)",
        description: "Cuantifica la dimensión transversal esquelética maxilar (J.D-J.G), mandibular (Go.D-Go.G) y nasal (Ln.D-Ln.G) para planificar y evaluar disyunción asistida por microtornillos (MSE/MARPE).",
        literature_reference: "Moon W (2018) Maxillary Skeletal Expander (MSE); Carlson C et al. (2016) Am J Orthod Dentofacial Orthop.",
        measurements: [
          metric("J.D-J.G", "Ancho Esquelético Maxilar (J.D - J.G)", maxW, "mm", 61, 64, 67, "Compresión transversal esquelética maxilar", "Anchura transversal maxilar normal", "Maxilar transversalmente amplio", ["JD", "JG"]),
          metric("Go.D-Go.G", "Ancho Mandibular Bigonial (Go.D - Go.G)", bigonialW, "mm", 80, 84, 88, "Anchura mandibular disminuida", "Anchura bigonial normal", "Hiperplasia transversal mandibular", ["GoD", "GoG"]),
          metric("Def-MSE", "Déficit Transversal Maxilomandibular (MSE)", transverseDef, "mm", -2, 0, 2, "Exceso transversal maxilar relativo", "Equilibrio transversal maxilo-mandibular", "Deficiencia transversal maxilar verdadera (indicación de MSE/MARPE)", ["JD", "JG", "GoD", "GoG"]),
          metric("Ln.D-Ln.G", "Ancho de Cavidad Nasal (Ln.D - Ln.G)", nasalW, "mm", 25, 28, 31, "Estrechamiento de apertura piriforme nasal", "Anchura nasal normal", "Cavidad nasal amplia post-expansión", ["LnD", "LnG"]),
          metric("Zyg.D-Zyg.G", "Ancho Bicigomático (Zyg.D - Zyg.G)", bizyg, "mm", 122, 130, 138, "Tercio medio estrecho", "Anchura bicigomática normal", "Cara ancha / braquicéfalo", ["ZygD", "ZygG"]),
          metric("Dev-Me", "Desviación Mentoniana a Línea Media Sagital", midlineDev, "mm", 0, 0.5, 2, "Simetría mentoniana", "Simetría facial frontal conservada (<2 mm)", "Asimetría mandibular transversal (>2 mm)", ["CrG", "mMe"])
        ],
        traced_lines: [
          { label: "Eje Sagital Medio (Cr.G-mMe)", p1: CrG, p2: mMe, color: "#facc15", dashed: true },
          { label: "Ancho Bicigomático", p1: ZygD, p2: ZygG, color: "#38bdf8", dashed: false },
          { label: "Ancho Nasal (Ln)", p1: LnD, p2: LnG, color: "#14b8a6", dashed: false },
          { label: "Ancho Maxilar (J.D-J.G)", p1: JD, p2: JG, color: "#22c55e", dashed: false },
          { label: "Ancho Bigonial (Go.D-Go.G)", p1: GoD, p2: GoG, color: "#ef4444", dashed: false }
        ],
        summary_diagnosis: `Ancho Maxilar (J-J) = ${maxW.toFixed(1)} mm | Bigonial = ${bigonialW.toFixed(1)} mm | Déficit MSE = ${transverseDef.toFixed(1)} mm.`,
        recommendations: [
          "Cuando el déficit transversal maxilomandibular supere 3 mm en pacientes CS4–CS6, planificar MSE con anclaje bicortical posterior para apertura paralela de la sutura media palatina y del piso nasal."
        ]
      };
      break;
    }

    case "olmos": {
      const cranioCerv = angle4Pts(ENP, Ba, Od, C2i);
      const suboccMm = distMm(Ba, C2i, scale) * 0.45;
      const hyoidMm = signedDistToLineMm(C3i, Rgn, H, scale);
      const occFh = angle4Pts(Po, Or, OccPost, OccAnt);

      result = {
        id: "olmos",
        number: 10,
        name: "10. Olmos (Articular, Craneocervical y TTM)",
        description: "Evalúa la estabilidad condilar, la postura craneocervical (McGregor-Odontoides), el espacio funcional suboccipital y el plano oclusal en pacientes con trastornos temporomandibulares.",
        literature_reference: "Olmos SR (2005, 2016) Craniofacial pain & TMD protocols; Rocabado M (1983) Biomechanical relationship of the cranial, cervical, and hyoid regions.",
        measurements: [
          metric("Ang-Craniocerv", "Ángulo Craneovertebral (McGregor - Odontoides)", cranioCerv, "°", 96, 101, 106, "Extensión craneocervical (<96°): compresión suboccipital", "Postura craneocervical ortostática fisiológica (96° - 106°)", "Flexión craneocervical (>106°): rectificación cervical y sobrecarga ATM", ["ENP", "Ba", "Od", "C2i"]),
          metric("Esp-C0C1C2", "Espacio Funcional Suboccipital (C0-C1-C2)", suboccMm, "mm", 4, 6.5, 9, "Disminución del espacio suboccipital (<4 mm, riesgo de cefalea/TTM)", "Espacio funcional suboccipital conservado (4 - 9 mm)", "Espacio suboccipital aumentado (>9 mm)", ["Ba", "Od", "C2i"]),
          metric("H-C3Rgn", "Posición Vertical del Hioides (H a C3-Rgn)", hyoidMm, "mm", 2, 5, 8, "Hioides ascendido o invertido (hipertonía suprahioidea)", "Relación fisiológica del triángulo hioideo (5 mm)", "Hioides descendido (hipotonía lingual / disfunción respiratoria)", ["C3i", "Rgn", "H"]),
          metric("FH-Occl-Olmos", "Inclinación del Plano Oclusal (FH - Occ)", occFh, "°", 6, 9, 12, "Plano oclusal horizontalizado", "Plano oclusal funcional estable para la ATM", "Plano oclusal empinado con vector compresivo retrodiscal", ["Po", "Or", "OccPost", "OccAnt"])
        ],
        traced_lines: [
          { label: "Plano McGregor (ENP-Op)", p1: ENP, p2: Op, color: "#22c55e", dashed: false },
          { label: "Plano Odontoides (Od-C2)", p1: Od, p2: C2i, color: "#f59e0b", dashed: false },
          { label: "C3 - Rgn", p1: C3i, p2: Rgn, color: "#38bdf8", dashed: true }
        ],
        summary_diagnosis: `Ángulo Craneovertebral = ${cranioCerv.toFixed(1)}° | Espacio Suboccipital = ${suboccMm.toFixed(1)} mm | Hioides = ${hyoidMm.toFixed(1)} mm.`,
        recommendations: [
          "En disfunción temporomandibular (TTM) con compresión retrodiscal y alteración craneocervical, integrar descompresión articular con fisioterapia de columna cervical superior."
        ]
      };
      break;
    }

    case "riedel": {
      const convDeg = 180 - angle3Pts(N, A, Pog);
      result = {
        id: "riedel",
        number: 11,
        name: "11. Riedel",
        description: "Evaluación angular fundamental de las relaciones del maxilar y la mandíbula con la base craneal anterior (SNA, SNB, ANB, N-A-Pog, SN-GoMe).",
        literature_reference: "Riedel RA (1952) The relation of maxillary structures to cranium in malocclusion and in normal occlusion, Angle Orthod 22(3):142-145.",
        measurements: [
          metric("SNA", "Ángulo SNA", sna, "°", 80, 82, 84, "Retrusión maxilar", "Posición sagital maxilar normal", "Protrusión maxilar", ["S", "N", "A"]),
          metric("SNB", "Ángulo SNB", snb, "°", 78, 80, 82, "Retrusión mandibular", "Posición sagital mandibular normal", "Prognatismo mandibular", ["S", "N", "B"]),
          metric("ANB", "Ángulo ANB", anb, "°", 0, 2, 4, "Clase III esquelética", "Clase I esquelética", "Clase II esquelética", ["S", "N", "A", "B"]),
          metric("N-A-Pog", "Ángulo de Convexidad Esquelética (N-A-Pog)", convDeg, "°", -4, 2, 6, "Perfil cóncavo", "Convexidad esquelética armónica", "Perfil convexo", ["N", "A", "Pog"]),
          metric("SN-GoMe", "Ángulo S-N a Plano Mandibular", snGoMe, "°", 29, 32, 35, "Hipodivergente", "Normodivergente", "Hiperdivergente", ["S", "N", "Go", "Me"])
        ],
        traced_lines: [
          { label: "S-N", p1: S, p2: N, color: "#38bdf8", dashed: false },
          { label: "N-A", p1: N, p2: A, color: "#22c55e", dashed: false },
          { label: "N-B", p1: N, p2: B, color: "#f59e0b", dashed: false }
        ],
        summary_diagnosis: `Riedel: SNA = ${sna.toFixed(1)}°, SNB = ${snb.toFixed(1)}°, ANB = ${anb.toFixed(1)}°.`,
        recommendations: [
          "Proporciona un diagnóstico sagital rápido y reproducible; complementar con Wits cuando SNA/SNB se alejen de la norma."
        ]
      };
      break;
    }

    case "vas": {
      const overjetMm = (U1i.x - L1i.x) * scale;
      const overbiteMm = (U1i.y - L1i.y) * scale;
      const liEline = signedDistToLineMm(Prn, PogSoft, Li, scale);
      result = {
        id: "vas",
        number: 12,
        name: "12. VAS (Análisis Simplificado)",
        description: "Visión rápida de las relaciones maxilares, mandibulares, dentoalveolares y estéticas para valoraciones iniciales y controles periódicos.",
        literature_reference: "Protocolo Clínico de Valoración Cefalométrica Simplificada (VAS).",
        measurements: [
          metric("SNA", "SNA (Posición Maxilar)", sna, "°", 80, 82, 84, "Retrusión maxilar", "Maxilar normoposicionado", "Protrusión maxilar", ["S", "N", "A"]),
          metric("SNB", "SNB (Posición Mandibular)", snb, "°", 78, 80, 82, "Retrusión mandibular", "Mandíbula normoposicionada", "Prognatismo mandibular", ["S", "N", "B"]),
          metric("ANB", "ANB (Clase Esquelética)", anb, "°", 0, 2, 4, "Clase III", "Clase I", "Clase II", ["S", "N", "A", "B"]),
          metric("FMA", "FMA (Biotipo Vertical)", fma, "°", 20, 25, 30, "Braquifacial", "Mesofacial", "Dolicofacial", ["Po", "Or", "Go", "Me"]),
          metric("IMPA", "IMPA (Incisivo Inf / GoMe)", impa, "°", 86, 90, 94, "Retroinclinado", "Normoinclinado", "Proinclinado", ["L1a", "L1i", "Go", "Me"]),
          metric("Overjet", "Resalte Incisivo (Overjet)", overjetMm, "mm", 1.5, 2.5, 4, "Mordida cruzada / borde a borde", "Resalte normal", "Resalte aumentado", ["U1i", "L1i"]),
          metric("Overbite", "Sobremordida Vertical (Overbite)", overbiteMm, "mm", 1.5, 2.5, 4, "Mordida abierta anterior", "Sobremordida normal", "Sobremordida profunda", ["U1i", "L1i"]),
          metric("Li-E", "Labio Inferior a Línea E", liEline, "mm", -4, -2, 0, "Labio retruido", "Perfil labial armónico", "Labio protruido", ["Prn", "Pog'", "Li"])
        ],
        traced_lines: [
          { label: "S-N", p1: S, p2: N, color: "#38bdf8", dashed: false },
          { label: "N-A", p1: N, p2: A, color: "#22c55e", dashed: false },
          { label: "N-B", p1: N, p2: B, color: "#f59e0b", dashed: false },
          { label: "Go-Me", p1: Go, p2: Me, color: "#ef4444", dashed: false }
        ],
        summary_diagnosis: `VAS: ANB = ${anb.toFixed(1)}°, FMA = ${fma.toFixed(1)}°, IMPA = ${impa.toFixed(1)}°, Overjet = ${overjetMm.toFixed(1)} mm.`,
        recommendations: [
          "Utilizar en controles periódicos de reevaluación para monitorear el control de torque incisivo y plano mandibular."
        ]
      };
      break;
    }

    case "di_paolo": {
      const maxBase = distMm(Pti, A, scale);
      const mandBase = distMm(Go, B, scale) * 0.82;
      const antH = distMm(A, B, scale);
      const postH = distMm(Pti, Go, scale) * 0.78;
      const avgH = Math.max(1, (antH + postH) / 2);
      const quadRatio = (maxBase / avgH) * 100;

      result = {
        id: "di_paolo",
        number: 13,
        name: "13. Di Paolo (Análisis del Cuadrilátero)",
        description: "Evalúa la proporcionalidad individualizada 1:1 del cuadrilátero craneofacial inferior entre las longitudes basales maxilar/mandibular y el promedio de las alturas faciales anterior y posterior.",
        literature_reference: "Di Paolo RJ et al. (1983) The quadrilateral analysis: an individualized skeletal assessment, Am J Orthod 83(1):19-32.",
        measurements: [
          metric("Base-Max-DP", "Longitud de Base Maxilar (A' - Ptm')", maxBase, "mm", 47, 51, 55, "Hipoplasia sagital de base maxilar", "Longitud de base maxilar proporcional", "Exceso sagital de base maxilar", ["Pti", "A"]),
          metric("Base-Mand-DP", "Longitud Proyectada Base Mandibular (B' - J')", mandBase, "mm", 47, 51, 55, "Deficiencia de base dentoalveolar mandibular", "Longitud mandibular proporcional a la base maxilar", "Exceso de base mandibular", ["Go", "B"]),
          metric("Alt-Ant-DP", "Altura Facial Anterior Inferior (A' - B')", antH, "mm", 34, 38, 42, "Altura dentoalveolar anterior disminuida", "Altura anterior equilibrada", "Exceso vertical anterior (mordida abierta esquelética)", ["A", "B"]),
          metric("Alt-Post-DP", "Altura Facial Posterior Inferior (Ptm' - J')", postH, "mm", 28, 32, 36, "Deficiencia vertical posterior", "Altura posterior equilibrada", "Altura posterior aumentada", ["Pti", "Go"]),
          metric("Ratio-DP", "Índice Cuadrilátero de Di Paolo (Base / Altura Media)", quadRatio, "%", 95, 100, 105, "Desproporción vertical > sagital", "Relación cuadrilátera 1:1 equilibrada de Di Paolo", "Predominio sagital sobre altura inferior", ["Pti", "A", "B", "Go"])
        ],
        traced_lines: [
          { label: "Base Maxilar (Pti-A)", p1: Pti, p2: A, color: "#22c55e", dashed: false },
          { label: "Altura Anterior (A-B)", p1: A, p2: B, color: "#f59e0b", dashed: false },
          { label: "Base Mandibular (B-Go)", p1: B, p2: Go, color: "#38bdf8", dashed: false },
          { label: "Altura Posterior (Pti-Go)", p1: Pti, p2: Go, color: "#a855f7", dashed: false }
        ],
        summary_diagnosis: `Índice Cuadrilátero de Di Paolo = ${quadRatio.toFixed(1)}% (Base Max = ${maxBase.toFixed(1)} mm, Base Mand = ${mandBase.toFixed(1)} mm).`,
        recommendations: [
          "Excelente para distinguir si una maloclusión se debe a desproporción de arcos basales o a alteración vertical dentoalveolar."
        ]
      };
      break;
    }

    case "kim": {
      const abGoMe = acuteAngle4Pts(A, B, Go, Me);
      const fhPp = signedAngle4Pts(Po, Or, ENP, ENA);
      const odi = abGoMe + fhPp;
      const fhNpog = angle4Pts(Po, Or, N, Pog);
      const abNpogSigned = -Math.abs(signedAngle4Pts(N, Pog, A, B));
      const apdi = fhNpog + abNpogSigned + fhPp;
      const cf = odi + apdi;

      result = {
        id: "kim",
        number: 14,
        name: "14. Kim (ODI, APDI y Combination Factor)",
        description: "Cuantifica el indicador de profundidad de sobremordida (ODI), el indicador de displasia anteroposterior (APDI) y el factor combinado (CF = ODI + APDI).",
        literature_reference: "Kim YH (1974) Overbite depth indicator, Angle Orthod; Kim YH & Vietas JJ (1978) Anteroposterior dysplasia indicator.",
        measurements: [
          metric("ODI", "ODI (Overbite Depth Indicator)", odi, "°", 68, 74.5, 80.5, "Alta tendencia a mordida abierta esquelética (ODI < 68°)", "Capacidad de sobremordida esquelética normal (74.5° ± 6°)", "Tendencia a mordida profunda esquelética (ODI > 80.5°)", ["A", "B", "Go", "Me", "Po", "Or", "ENA", "ENP"]),
          metric("APDI", "APDI (Anteroposterior Dysplasia Indicator)", apdi, "°", 77.5, 81.4, 85.5, "Displasia anteroposterior Clase II (APDI < 77.5°)", "Relación anteroposterior Clase I normal (81.4° ± 4°)", "Displasia anteroposterior Clase III (APDI > 85.5°)", ["Po", "Or", "N", "Pog", "A", "B", "ENA", "ENP"]),
          metric("CF", "CF (Combination Factor = ODI + APDI)", cf, "°", 150, 155.9, 162, "Tendencia favorable a terapia con extracciones (CF < 150°)", "Equilibrio combinado vertical y sagital de Kim (155.9°)", "Fuerte indicación de tratamiento SIN extracciones (CF > 162°)", ["A", "B", "Go", "Me", "N", "Pog"]),
          metric("AB-GoMe", "Ángulo Plano A-B al Plano Mandibular", abGoMe, "°", 68, 74, 80, "Ángulo AB-GoMe agudo (riesgo de mordida abierta)", "Ángulo AB-GoMe normal", "Ángulo AB-GoMe elevado (mordida profunda)", ["A", "B", "Go", "Me"])
        ],
        traced_lines: [
          { label: "Plano Palatino (ENP-ENA)", p1: ENP, p2: ENA, color: "#14b8a6", dashed: false },
          { label: "Plano A-B", p1: A, p2: B, color: "#f59e0b", dashed: false },
          { label: "Go-Me", p1: Go, p2: Me, color: "#ef4444", dashed: false }
        ],
        summary_diagnosis: `Kim: ODI = ${odi.toFixed(1)}° | APDI = ${apdi.toFixed(1)}° | Factor Combinado (CF) = ${cf.toFixed(1)}°.`,
        recommendations: [
          "Si ODI < 68° con mordida abierta, controlar el plano oclusal posterior mediante mecánica MEAW o intrusión molar con microtornillos."
        ]
      };
      break;
    }

    case "hioides_va": {
      const c3Rgn = distMm(C3i, Rgn, scale);
      const c3H = distMm(C3i, H, scale);
      const hRgn = distMm(H, Rgn, scale);
      const hToC3Rgn = signedDistToLineMm(C3i, Rgn, H, scale);
      const hToGoMe = distMm(projectOnLine(Go, Me, H), H, scale);
      const pasMm = distMm(PAS_Ant, PAS_Post, scale);

      result = {
        id: "hioides_va",
        number: 15,
        name: "15. Hioides y VA (Posicionamiento Vertical/Anterior y Vía Aérea)",
        description: "Examina el Triángulo Hioideo de Bibby & Preston, la distancia MP-H y el Espacio Aéreo Faríngeo Posterior (PAS) para la evaluación de apnea obstructiva del sueño (SAHOS).",
        literature_reference: "Bibby RE & Preston CB (1981) The hyoid triangle, Am J Orthod; Riley R, Guilleminault C et al. (1983) Sleep.",
        measurements: [
          metric("C3-Rgn", "Base del Triángulo Hioideo (C3 - Rgn)", c3Rgn, "mm", 62, 67.2, 73, "Distancia cervicomandibular reducida", "Distancia C3-Rgn normal", "Distancia cervicomandibular amplia", ["C3i", "Rgn"]),
          metric("C3-H", "Distancia Cervical a Hioides (C3 - H)", c3H, "mm", 29, 31.7, 35, "Hioides posteriorizado hacia columna cervical", "Posición anteroposterior hioidea normal", "Hioides anteriorizado", ["C3i", "H"]),
          metric("H-Rgn", "Distancia Hioides a Sínfisis Posterior (H - Rgn)", hRgn, "mm", 33, 36.8, 41, "Longitud suprahioidea corta", "Distancia H-Rgn normal", "Longitud suprahioidea aumentada", ["H", "Rgn"]),
          metric("H-C3Rgn", "Altura del Triángulo Hioideo (H a C3-Rgn)", hToC3Rgn, "mm", 2, 4.8, 8, "Hioides superior/invertido respecto a C3-Rgn", "Posición vertical normal del hioides (+4.8 mm)", "Descenso caudal del hueso hioides (>8 mm, marcador de SAHOS)", ["C3i", "Rgn", "H"]),
          metric("MP-H", "Distancia Plano Mandibular al Hioides (MP - H)", hToGoMe, "mm", 11, 15, 19, "MP-H disminuido", "Distancia MP-H normal (15 ± 4 mm)", "MP-H > 19 mm: predictor cefalométrico de apnea obstructiva del sueño (SAHOS)", ["Go", "Me", "H"]),
          metric("PAS", "Espacio Aéreo Faríngeo Posterior (PAS)", pasMm, "mm", 10, 11.5, 14, "Estrechamiento retrobasilingual (<10 mm, riesgo de SAHOS)", "Calibre faríngeo normal (≥11 mm)", "Vía aérea amplia", ["PAS_Ant", "PAS_Post"])
        ],
        traced_lines: [
          { label: "C3 - Rgn", p1: C3i, p2: Rgn, color: "#38bdf8", dashed: false },
          { label: "C3 - H", p1: C3i, p2: H, color: "#22c55e", dashed: false },
          { label: "H - Rgn", p1: H, p2: Rgn, color: "#22c55e", dashed: false },
          { label: "PAS (Vía Aérea)", p1: PAS_Ant, p2: PAS_Post, color: "#ef4444", dashed: false }
        ],
        summary_diagnosis: `PAS = ${pasMm.toFixed(1)} mm | MP-H = ${hToGoMe.toFixed(1)} mm | H a C3-Rgn = ${hToC3Rgn.toFixed(1)} mm.`,
        recommendations: [
          "Si PAS < 10 mm y MP-H > 19 mm: evaluar mediante estudio del sueño y considerar dispositivo de avance mandibular o cirugía ortognática de avance bimaxilar."
        ]
      };
      break;
    }

    case "baccetti": {
      const age = Number(demographics.age_years) || 14;
      let csStage = 6, c3Concav = 2.3, c4Concav = 2.1, stageDesc = "CS6 (Maduración completa: crecimiento mandibular remanente mínimo)";
      if (age < 9.5) {
        csStage = 1; c3Concav = 0.3; c4Concav = 0.2;
        stageDesc = "CS1 (Pre-pico: bordes inferiores de C2, C3 y C4 planos; el pico puberal ocurrirá en ~2 años)";
      } else if (age < 11.0) {
        csStage = 2; c3Concav = 1.1; c4Concav = 0.4;
        stageDesc = "CS2 (Pre-pico: concavidad en borde inferior de C2; el pico puberal iniciará en ~1 año)";
      } else if (age < 13.0) {
        csStage = 3; c3Concav = 1.6; c4Concav = 0.6;
        stageDesc = "CS3 (En el pico puberal: concavidades en C2 y C3; momento óptimo para ortopedia funcional mandibular)";
      } else if (age < 14.5) {
        csStage = 4; c3Concav = 2.0; c4Concav = 1.5;
        stageDesc = "CS4 (Pico puberal activo: concavidades en C2, C3 y C4 con cuerpos rectangulares horizontales)";
      } else if (age < 16.5) {
        csStage = 5; c3Concav = 2.2; c4Concav = 1.9;
        stageDesc = "CS5 (Post-pico: al menos uno de C3 o C4 es cuadrado; el pico terminó hace ~1 año)";
      }
      const c2c3 = distMm(C2i, C3i, scale);
      const c3c4 = distMm(C3i, C4i, scale);

      result = {
        id: "baccetti",
        number: 16,
        name: "16. Baccetti (Maduración Vertebral Cervical CVM)",
        description: "Determina el estadio de maduración esquelética cervical (CS1 a CS6) sobre C2, C3 y C4 para identificar el pico de crecimiento mandibular.",
        literature_reference: "Baccetti T, Franchi L, McNamara JA Jr (2005) The Cervical Vertebral Maturation (CVM) method, Semin Orthod 11(3):119-129.",
        measurements: [
          metric("CVM-Stage", "Estadio de Maduración Vertebral Cervical (CS1 - CS6)", csStage, "CS", 2.5, 3.5, 4.5, "Fase prepuberal (CS1-CS2)", "Ventana óptima de máximo crecimiento puberal mandibular (CS3-CS4)", "Fase post-puberal / madurez esquelética (CS5-CS6)", ["C2i", "C3i", "C4i"]),
          metric("Concav-C3", "Concavidad Inferior de C3", c3Concav, "mm", 1.0, 1.5, 2.5, "Borde inferior de C3 plano (<1 mm: CS1-CS2)", "Concavidad inferior de C3 presente (≥1 mm: CS3-CS6)", "Concavidad marcada de C3", ["C3i"]),
          metric("Concav-C4", "Concavidad Inferior de C4", c4Concav, "mm", 1.0, 1.4, 2.5, "Borde inferior de C4 plano (<1 mm: CS1-CS3)", "Concavidad inferior de C4 presente (≥1 mm: CS4-CS6)", "Concavidad marcada de C4", ["C4i"]),
          metric("H-C2C3", "Altura Intervertebral Anterior C2-C3", c2c3, "mm", 12, 16, 21, "Cuerpo C3 trapezoidal bajo", "Desarrollo vertical cervical en curso", "Cuerpo C3 rectangular vertical", ["C2i", "C3i"]),
          metric("H-C3C4", "Altura Intervertebral Anterior C3-C4", c3c4, "mm", 12, 16.5, 22, "Cuerpo C4 horizontal", "Desarrollo vertical de C4 proporcional", "Cuerpo C4 rectangular vertical (CS6)", ["C3i", "C4i"])
        ],
        traced_lines: [
          { label: "Eje Cervical C2-C3", p1: C2i, p2: C3i, color: "#a855f7", dashed: false },
          { label: "Eje Cervical C3-C4", p1: C3i, p2: C4i, color: "#a855f7", dashed: false }
        ],
        summary_diagnosis: stageDesc,
        recommendations: [
          "En Clase III por deficiencia maxilar, intervenir en CS1–CS2 con disyunción y máscara facial.",
          "En Clase II por deficiencia mandibular, intervenir en CS3–CS4 para maximizar el incremento de longitud mandibular Co-Gn."
        ]
      };
      break;
    }

    case "delaire":
    default: {
      const c1c2 = angle4Pts(M, Cla, M, Oi);
      const c1c4 = 180 - angle4Pts(M, Cla, Clp, Od);
      const c1f1 = 180 - angle4Pts(Cla, M, M, Np);
      const mOiMm = Math.max(1, distMm(M, Oi, scale));
      const mPtsMm = distMm(M, Pt, scale);
      const champCfC2 = (mPtsMm / mOiMm) * 100;
      const mOpMm = distMm(M, Op, scale);
      const rapportC2C3 = (mOpMm / mOiMm) * 100;
      const meToF1 = signedDistToLineMm(M, Np, Me, scale);
      const u1ToF1 = acuteAngle4Pts(U1a, U1i, M, Np);
      const nEna = distMm(N, ENA, scale);
      const enaMe = distMm(ENA, Me, scale);
      const vertPct = (nEna / Math.max(1, nEna + enaMe)) * 100;

      const dxF1 = Np.x - M.x;
      const dyF1 = Np.y - M.y;
      const f1Bottom = { x: M.x + dxF1 * 2.4, y: M.y + dyF1 * 2.4 };

      result = {
        id: "delaire",
        number: 17,
        name: "17. Delaire Evolution (Arquitectural y Estructural)",
        description: "Reconstrucción directa de los modelos XML de Delaire Evolution (Delaire_CF, Top 12, Analyse Frontale): evalúa el equilibrio arquitectural entre las líneas craneales (C1, C2, C3, C4) y las líneas faciales (F1, F4, F5, F7, F8).",
        literature_reference: "Delaire J (1978) L'analyse architecturale et structurale cranio-faciale (de profil), Rev Stomatol Chir Maxillofac; Delaire J, Schendel SA, Tulasne JF (1981).",
        measurements: [
          metric("C1/C2", "Ángulo Anterior de la Base del Cráneo (C1 / C2)", c1c2, "°", 20, 21.5, 23, "Base craneal anterior aplanada (<20°)", "Ángulo C1/C2 normal según Delaire (20° - 23°)", "Divergencia aumentada C1/C2 (>23°)", ["M", "Cla", "Oi"]),
          metric("C1/C4", "Ángulo Posterior Esfeno-Basilar (C1 / C4)", c1c4, "°", 115, 117.5, 120, "Flexión de la base del cráneo (<115°: predispone a Clase III)", "Equilibrio esfeno-occipital de Delaire (115° - 120°)", "Deflexión de la base craneal (>120°: predispone a Clase II)", ["M", "Cla", "Clp", "Od"]),
          metric("C1/F1", "Ángulo de Equilibrio Frontofacial (C1 / F1)", c1f1, "°", 88, 90, 92, "Retrusión del pilar maxilar anterior F1 (<88°)", "Equilibrio arquitectural frontomaxilar C1/F1 ideal (90° adulto)", "Protrusión del pilar anterior F1 (>92°)", ["Cla", "M", "Np"]),
          metric("CF-C2", "Campo Craneofacial sobre C2 (M-Pts / M-Oi)", champCfC2, "%", 49, 50, 51, "Campo facial reducido respecto a la base craneal (<49%)", "Proporción 50/50 de Delaire (campo craneofacial / craneorraquídeo)", "Campo craneofacial aumentado (>51%)", ["M", "Pt", "Oi"]),
          metric("C2/C3", "Relación C3 / C2 (M-Op / M-Oi)", rapportC2C3, "%", 78, 81, 84, "Campo craneorraquídeo estrecho (<78%)", "Proporción normal C3/C2 de Delaire (78% - 84%)", "Escama occipital corta (>84%)", ["M", "Op", "Oi"]),
          metric("Me-F1", "Distancia Menton (Me) a Línea F1 Teórica", meToF1, "mm", -2, 0, 2, "Retrognatia mandibular arquitectural (Me detrás de F1)", "Menton alineado sobre la línea de equilibrio facial F1", "Prognatismo mandibular arquitectural (Me delante de F1)", ["M", "Np", "Me"]),
          metric("N-ENA%", "Proporción Vertical Nasal N-ENA / N-Me (Delaire F4)", vertPct, "%", 43, 45, 47, "Exceso vertical del piso bucal inferior (N-ENA < 43%)", "Equilibrio vertical facial de Delaire (45% piso nasal / 55% bucal)", "Disminución vertical del piso bucal inferior (N-ENA > 47%)", ["N", "ENA", "Me"]),
          metric("U1-F1", "Angulación Incisivo Superior respecto a F1", u1ToF1, "°", 18, 23, 28, "Linguoversión del incisivo superior respecto a F1", "Inclinación incisiva superior armónica con F1", "Vestibuloversión del incisivo superior respecto a F1", ["U1a", "U1i", "M", "Np"])
        ],
        traced_lines: [
          { label: "C1 (M - Cla)", p1: M, p2: Cla, color: "#ef4444", dashed: false },
          { label: "C2 (M - Oi)", p1: M, p2: Oi, color: "#f97316", dashed: false },
          { label: "C3 (M - Op)", p1: M, p2: Op, color: "#facc15", dashed: true },
          { label: "C4 (Clp - Od)", p1: Clp, p2: Od, color: "#ef4444", dashed: false },
          { label: "F1 (Equilibrio Frontofacial)", p1: M, p2: f1Bottom, color: "#22c55e", dashed: false },
          { label: "F4 (Plano Oclusal Teórico)", p1: OccPost, p2: OccAnt, color: "#38bdf8", dashed: false },
          { label: "Rama Mandibular (Ar-Go-Me)", p1: Ar, p2: Go, color: "#60a5fa", dashed: true }
        ],
        summary_diagnosis: `Delaire Evolution: C1/C2 = ${c1c2.toFixed(1)}° | C1/C4 = ${c1c4.toFixed(1)}° | C1/F1 = ${c1f1.toFixed(1)}° | Campo CF/C2 = ${champCfC2.toFixed(1)}% | Me a F1 = ${meToF1.toFixed(1)} mm.`,
        recommendations: [
          "El análisis arquitectural de Delaire distingue si la anomalía dentomaxilofacial se origina en la base craneal (rotación esfenobasilar C1/C4), en el pilar anterior maxilar (C1/F1) o en el cuerpo/rama mandibular.",
          "Planificar los movimientos quirúrgicos ortognáticos posicionando el borde premaxilar y el mentón sobre la línea F1 teórica y ajustando la altura vertical según la proporción 45%/55%."
        ]
      };
      break;
    }
  }

  // Apply manual clinician overrides if any
  result.measurements = result.measurements.map((m) => {
    const key = `${result.id}:${m.code}`;
    if (userOverrides[key] !== undefined && userOverrides[key] !== "") {
      const customVal = Number(userOverrides[key]);
      if (!Number.isNaN(customVal)) {
        const status = customVal < m.norm_min ? "low" : customVal > m.norm_max ? "high" : "normal";
        return { ...m, value: customVal, status, overridden: true };
      }
    }
    return m;
  });

  return result;
}

/**
 * Parses binary DICOM Part 10 files (`.dcm` / `.dicom`) directly in memory to extract:
 * - PatientName (0010,0010) -> Nombre, Apellido
 * - PatientID (0010,0020)
 * - PatientBirthDate (0010,0030)
 * - PatientSex (0010,0040)
 * - PatientAge (0010,1010)
 * - CountryOfResidence (0010,2150)
 * - EthnicGroup (0010,2160)
 * - StudyDate (0008,0020)
 * - Modality (0008,0060)
 * - ImagerPixelSpacing (0018,1164) / PixelSpacing (0028,0030)
 * - Rows (0028,0010), Columns (0028,0011), BitsAllocated (0028,0100), PixelData (7FE0,0010)
 */
export function parseDicomBuffer(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const meta = {
    isDicom: false,
    first_name: "",
    last_name: "",
    patient_id: "",
    age_years: null,
    birth_date: "",
    sex: "",
    ethnicity: "",
    country: "",
    study_date: "",
    mm_per_pixel: null,
    rows: 0,
    cols: 0,
    bitsAllocated: 16,
    pixelDataOffset: null,
    pixelDataLength: 0,
    tagsFound: []
  };

  // Check DICM magic at offset 128
  let offset = 0;
  if (
    bytes.length > 132 &&
    bytes[128] === 0x44 &&
    bytes[129] === 0x49 &&
    bytes[130] === 0x43 &&
    bytes[131] === 0x4d
  ) {
    meta.isDicom = true;
    offset = 132;
  } else {
    return meta;
  }

  const decoder = new TextDecoder("utf-8", { fatal: false });
  const longVRs = new Set(["OB", "OW", "OF", "SQ", "UT", "UN", "OD", "OL"]);

  while (offset + 8 <= bytes.length) {
    const group = view.getUint16(offset, true);
    const element = view.getUint16(offset + 2, true);
    const vr = String.fromCharCode(bytes[offset + 4], bytes[offset + 5]);
    const isExplicit = /^[A-Z]{2}$/.test(vr);

    let valLen = 0;
    let headerLen = 8;

    if (isExplicit) {
      if (longVRs.has(vr)) {
        if (offset + 12 > bytes.length) break;
        valLen = view.getUint32(offset + 8, true);
        headerLen = 12;
      } else {
        valLen = view.getUint16(offset + 6, true);
        headerLen = 8;
      }
    } else {
      valLen = view.getUint32(offset + 4, true);
      headerLen = 8;
    }

    const valStart = offset + headerLen;
    if (group === 0x7fe0 && element === 0x0010) {
      meta.pixelDataOffset = valStart;
      meta.pixelDataLength = valLen === 0xffffffff ? bytes.length - valStart : valLen;
      break;
    }

    if (valLen === 0xffffffff || valStart + valLen > bytes.length) {
      offset += headerLen;
      continue;
    }

    const readStr = () =>
      decoder
        .decode(bytes.subarray(valStart, valStart + valLen))
        .replace(/\0/g, "")
        .trim();

    const tagHex = `${group.toString(16).padStart(4, "0")},${element.toString(16).padStart(4, "0")}`;

    if (group === 0x0010 && element === 0x0010) {
      const pn = readStr();
      const parts = pn.split("^");
      meta.last_name = (parts[0] || "").trim();
      meta.first_name = (parts[1] || parts[0] || "").trim();
      meta.tagsFound.push([`${tagHex} PatientName`, pn]);
    } else if (group === 0x0010 && element === 0x0020) {
      meta.patient_id = readStr();
      meta.tagsFound.push([`${tagHex} PatientID`, meta.patient_id]);
    } else if (group === 0x0010 && element === 0x0030) {
      meta.birth_date = readStr();
      meta.tagsFound.push([`${tagHex} PatientBirthDate`, meta.birth_date]);
    } else if (group === 0x0010 && element === 0x0040) {
      meta.sex = readStr();
      meta.tagsFound.push([`${tagHex} PatientSex`, meta.sex]);
    } else if (group === 0x0010 && element === 0x1010) {
      const ageRaw = readStr();
      const num = parseFloat(ageRaw);
      if (!Number.isNaN(num)) {
        meta.age_years = ageRaw.endsWith("M") ? Math.round((num / 12) * 10) / 10 : num;
      }
      meta.tagsFound.push([`${tagHex} PatientAge`, ageRaw]);
    } else if (group === 0x0010 && element === 0x2150) {
      meta.country = readStr();
      meta.tagsFound.push([`${tagHex} CountryOfResidence`, meta.country]);
    } else if (group === 0x0010 && element === 0x2160) {
      meta.ethnicity = readStr();
      meta.tagsFound.push([`${tagHex} EthnicGroup`, meta.ethnicity]);
    } else if (group === 0x0008 && element === 0x0020) {
      meta.study_date = readStr();
      meta.tagsFound.push([`${tagHex} StudyDate`, meta.study_date]);
    } else if ((group === 0x0018 && element === 0x1164) || (group === 0x0028 && element === 0x0030)) {
      const sp = readStr();
      const first = parseFloat(sp.split("\\")[0]);
      if (!Number.isNaN(first) && first > 0.001 && first < 5) {
        meta.mm_per_pixel = first;
      }
      meta.tagsFound.push([`${tagHex} PixelSpacing`, sp]);
    } else if (group === 0x0028 && element === 0x0010 && valLen >= 2) {
      meta.rows = view.getUint16(valStart, true);
    } else if (group === 0x0028 && element === 0x0011 && valLen >= 2) {
      meta.cols = view.getUint16(valStart, true);
    } else if (group === 0x0028 && element === 0x0100 && valLen >= 2) {
      meta.bitsAllocated = view.getUint16(valStart, true);
    }

    offset = valStart + valLen;
  }

  return meta;
}
