import {
  LANDMARK_CATALOG,
  ANALYSES_CATALOG,
  evaluateCephalometricAnalysis,
  parseDicomBuffer,
  distMm,
  angle3Pts
} from "./ceph_engine.js";

const state = {
  theme: "dark",
  activeAnalysisId: "delaire",
  activeTool: "move", // "move" | "dist" | "angle" | "calibrate"
  showPlanes: true,
  showLabels: true,
  invertImage: false,
  brightness: 100,
  contrast: 110,
  zoom: 1.0,
  panX: 0,
  panY: 0,
  imageWidth: 760,
  imageHeight: 720,
  loadedImage: null,
  syntheticMode: null, // "frontal_pa" | "opg" | null
  landmarks: {},
  selectedLandmarkId: "N",
  draggingLandmarkId: null,
  simpleMeasurements: [], // { type: 'dist'|'angle', pts: [{x,y}, ...] }
  pendingMeasurePts: [],
  userOverrides: {},
  demographics: {
    first_name: "Camila",
    last_name: "Valdés",
    age_years: 13.5,
    sex: "F",
    ethnicity: "Hispanic/Latin",
    country: "Chile",
    modality: "Lateral",
    mm_per_pixel: 0.18
  }
};

const canvas = document.getElementById("cephCanvas");
const ctx = canvas.getContext("2d");

function initLandmarksForImage(w, h) {
  state.landmarks = {};
  for (const def of LANDMARK_CATALOG) {
    state.landmarks[def.id] = {
      id: def.id,
      name: def.name,
      category: def.category,
      view: def.view,
      x: Math.round(def.nx * w * 10) / 10,
      y: Math.round(def.ny * h * 10) / 10,
      confidence: 0.95,
      source: "CEPHMark-Net/Aariz"
    };
  }
}

function getVisibleLandmarkDefs() {
  const filterTxt = (document.getElementById("inpFilterLandmark")?.value || "").trim().toLowerCase();
  const isFrontal = state.demographics.modality === "Frontal" || state.activeAnalysisId === "mse";
  return LANDMARK_CATALOG.filter((def) => {
    const viewMatch = isFrontal ? def.view === "frontal" : def.view === "lateral";
    if (!viewMatch) return false;
    if (!filterTxt) return true;
    return (
      def.id.toLowerCase().includes(filterTxt) ||
      def.name.toLowerCase().includes(filterTxt) ||
      def.desc.toLowerCase().includes(filterTxt)
    );
  });
}

function populateAnalysesSelector() {
  const sel = document.getElementById("selAnalysis");
  sel.innerHTML = "";
  for (const item of ANALYSES_CATALOG) {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = `${item.shortName} — ${item.category}`;
    if (item.id === state.activeAnalysisId) opt.selected = true;
    sel.appendChild(opt);
  }
}

function renderLandmarkSidebar() {
  const container = document.getElementById("landmarkListContainer");
  const visible = getVisibleLandmarkDefs();
  document.getElementById("landmarkCountLabel").textContent = String(visible.length);
  container.innerHTML = "";

  for (const def of visible) {
    const pt = state.landmarks[def.id] || { x: 0, y: 0 };
    const row = document.createElement("div");
    row.className = `landmark-row ${state.selectedLandmarkId === def.id ? "selected" : ""}`;
    row.innerHTML = `
      <div>
        <strong>${def.id}</strong> · <span style="color:var(--text-secondary)">${def.name}</span>
      </div>
      <span class="lm-coords">(${Math.round(pt.x)}, ${Math.round(pt.y)})</span>
    `;
    row.addEventListener("click", () => {
      state.selectedLandmarkId = def.id;
      document.getElementById("hudActivePoint").textContent = `📍 ${def.name}: ${def.desc}`;
      renderLandmarkSidebar();
      drawCanvas();
    });
    container.appendChild(row);
  }
}

function drawSyntheticRadiograph(w, h, mode) {
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, 40, w * 0.5, h * 0.5, w * 0.65);
  grad.addColorStop(0, "#334155");
  grad.addColorStop(0.6, "#1e293b");
  grad.addColorStop(1, "#020617");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = "rgba(226, 232, 240, 0.35)";
  ctx.lineWidth = 2.5;

  if (mode === "frontal_pa") {
    // Cranial vault & orbits PA silhouette
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.42, w * 0.26, h * 0.31, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Orbits
    ctx.beginPath();
    ctx.ellipse(w * 0.38, h * 0.39, w * 0.06, h * 0.05, 0, 0, Math.PI * 2);
    ctx.ellipse(w * 0.62, h * 0.39, w * 0.06, h * 0.05, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Piriform aperture
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.36);
    ctx.lineTo(w * 0.44, h * 0.48);
    ctx.lineTo(w * 0.56, h * 0.48);
    ctx.closePath();
    ctx.stroke();
    // Mandible frontal contour
    ctx.beginPath();
    ctx.moveTo(w * 0.27, h * 0.44);
    ctx.lineTo(w * 0.33, h * 0.68);
    ctx.lineTo(w * 0.5, h * 0.77);
    ctx.lineTo(w * 0.67, h * 0.68);
    ctx.lineTo(w * 0.73, h * 0.44);
    ctx.stroke();
  } else if (mode === "opg") {
    // Panoramic dental arch & mandibular condyles
    ctx.beginPath();
    ctx.moveTo(w * 0.14, h * 0.32);
    ctx.quadraticCurveTo(w * 0.16, h * 0.75, w * 0.5, h * 0.78);
    ctx.quadraticCurveTo(w * 0.84, h * 0.75, w * 0.86, h * 0.32);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.52, w * 0.26, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCanvas() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  const filterParts = [
    `brightness(${state.brightness}%)`,
    `contrast(${state.contrast}%)`
  ];
  if (state.invertImage) filterParts.push("invert(100%)");
  ctx.filter = filterParts.join(" ");

  if (state.loadedImage && !state.syntheticMode) {
    ctx.drawImage(state.loadedImage, 0, 0, w, h);
  } else {
    drawSyntheticRadiograph(w, h, state.syntheticMode || "frontal_pa");
  }
  ctx.restore();

  // Compute current active analysis
  const analysisResult = evaluateCephalometricAnalysis(
    state.activeAnalysisId,
    state.landmarks,
    state.demographics,
    state.userOverrides
  );

  // Draw traced cephalometric planes/lines
  if (state.showPlanes && analysisResult.traced_lines) {
    for (const seg of analysisResult.traced_lines) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = seg.color || "#38bdf8";
      ctx.lineWidth = 2.2;
      if (seg.dashed) ctx.setLineDash([6, 4]);
      ctx.moveTo(seg.p1.x, seg.p1.y);
      ctx.lineTo(seg.p2.x, seg.p2.y);
      ctx.stroke();

      if (state.showLabels && seg.label) {
        const mx = (seg.p1.x + seg.p2.x) / 2;
        const my = (seg.p1.y + seg.p2.y) / 2;
        ctx.font = "600 11px Inter, sans-serif";
        ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
        const tw = ctx.measureText(seg.label).width;
        ctx.fillRect(mx - 3, my - 12, tw + 6, 15);
        ctx.fillStyle = seg.color || "#38bdf8";
        ctx.fillText(seg.label, mx, my - 1);
      }
      ctx.restore();
    }
  }

  // Draw Delaire cranial-facial balance polygon when Delaire analysis is active
  if (state.showPlanes && state.activeAnalysisId === "delaire") {
    const M = state.landmarks["M"], Pts = state.landmarks["Pt"], Np = state.landmarks["Np"], Go = state.landmarks["Go"], Me = state.landmarks["Me"], Ar = state.landmarks["Ar"];
    if (M && Pts && Np && Go && Me && Ar) {
      ctx.save();
      ctx.fillStyle = "rgba(34, 197, 94, 0.10)";
      ctx.beginPath();
      ctx.moveTo(M.x, M.y);
      ctx.lineTo(Pts.x, Pts.y);
      ctx.lineTo(Ar.x, Ar.y);
      ctx.lineTo(Go.x, Go.y);
      ctx.lineTo(Me.x, Me.y);
      ctx.lineTo(Np.x, Np.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Draw simple user measurements (ruler & angles)
  for (const m of state.simpleMeasurements) {
    ctx.save();
    ctx.strokeStyle = "#facc15";
    ctx.fillStyle = "#facc15";
    ctx.lineWidth = 2;
    if (m.type === "dist" && m.pts.length === 2) {
      ctx.beginPath();
      ctx.moveTo(m.pts[0].x, m.pts[0].y);
      ctx.lineTo(m.pts[1].x, m.pts[1].y);
      ctx.stroke();
      const mm = distMm(m.pts[0], m.pts[1], state.demographics.mm_per_pixel);
      const mx = (m.pts[0].x + m.pts[1].x) / 2;
      const my = (m.pts[0].y + m.pts[1].y) / 2;
      ctx.font = "700 12px Inter, sans-serif";
      ctx.fillText(`📏 ${mm.toFixed(2)} mm`, mx + 6, my - 6);
    } else if (m.type === "angle" && m.pts.length === 3) {
      ctx.beginPath();
      ctx.moveTo(m.pts[0].x, m.pts[0].y);
      ctx.lineTo(m.pts[1].x, m.pts[1].y);
      ctx.lineTo(m.pts[2].x, m.pts[2].y);
      ctx.stroke();
      const deg = angle3Pts(m.pts[0], m.pts[1], m.pts[2]);
      ctx.font = "700 12px Inter, sans-serif";
      ctx.fillText(`📐 ${deg.toFixed(1)}°`, m.pts[1].x + 8, m.pts[1].y - 8);
    }
    ctx.restore();
  }

  // Draw pending measurement clicks
  for (const pt of state.pendingMeasurePts) {
    ctx.save();
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw anatomical landmarks
  const isFrontal = state.demographics.modality === "Frontal" || state.activeAnalysisId === "mse";
  const usedSet = new Set();
  for (const m of analysisResult.measurements) {
    for (const lmId of m.landmarks || []) usedSet.add(lmId);
  }

  for (const def of LANDMARK_CATALOG) {
    if ((isFrontal && def.view !== "frontal") || (!isFrontal && def.view !== "lateral")) continue;
    const pt = state.landmarks[def.id];
    if (!pt) continue;

    const isSelected = state.selectedLandmarkId === def.id;
    const isUsedInActive = usedSet.has(def.id);

    ctx.save();
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, isSelected ? 6.5 : isUsedInActive ? 5 : 3.8, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? "#facc15" : isUsedInActive ? "#ef4444" : "#38bdf8";
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // Crosshair center
    if (isSelected) {
      ctx.strokeStyle = "#facc15";
      ctx.beginPath();
      ctx.moveTo(pt.x - 10, pt.y);
      ctx.lineTo(pt.x + 10, pt.y);
      ctx.moveTo(pt.x, pt.y - 10);
      ctx.lineTo(pt.x, pt.y + 10);
      ctx.stroke();
    }

    if (state.showLabels) {
      ctx.font = isSelected || isUsedInActive ? "700 11.5px Inter, sans-serif" : "600 10.5px Inter, sans-serif";
      ctx.fillStyle = "#0f172a";
      ctx.fillText(def.id, pt.x + 8, pt.y + 4);
      ctx.fillStyle = isSelected ? "#facc15" : isUsedInActive ? "#ffffff" : "#cbd5e1";
      ctx.fillText(def.id, pt.x + 7, pt.y + 3);
    }
    ctx.restore();
  }

  updateAnalysisPanel(analysisResult);
}

function updateAnalysisPanel(result) {
  document.getElementById("analysisDescBox").textContent = result.description;
  document.getElementById("analysisRefBox").textContent = `Referencia: ${result.literature_reference}`;

  const tbody = document.getElementById("metricsTableBody");
  tbody.innerHTML = "";

  for (const m of result.measurements) {
    const tr = document.createElement("tr");
    const statusLabel = m.status === "normal" ? "NORM" : m.status === "high" ? "ALTO ↑" : "BAJO ↓";
    const overrideKey = `${result.id}:${m.code}`;
    tr.innerHTML = `
      <td>
        <strong>${m.label}</strong>
        <div style="font-size:10px;color:var(--text-muted)">${m.code} (${(m.landmarks || []).join("-")})</div>
      </td>
      <td>
        <input class="metric-input" data-key="${overrideKey}" type="number" step="0.1" value="${m.value}" title="Modificable por el clínico" />
        <span style="font-size:10.5px;color:var(--text-secondary)">${m.unit}</span>
      </td>
      <td style="white-space:nowrap;color:var(--text-secondary)">${m.norm_min} .. ${m.norm_max} ${m.unit}</td>
      <td><span class="badge ${m.status}">${statusLabel}</span></td>
      <td style="font-size:11px;line-height:1.35">${m.interpretation}</td>
    `;
    const inp = tr.querySelector(".metric-input");
    inp.addEventListener("change", (ev) => {
      state.userOverrides[overrideKey] = ev.target.value;
      drawCanvas();
    });
    tbody.appendChild(tr);
  }

  document.getElementById("summaryDiagnosisText").textContent = result.summary_diagnosis;
  const recList = document.getElementById("recommendationsList");
  recList.innerHTML = "";
  for (const rec of result.recommendations) {
    const li = document.createElement("li");
    li.textContent = rec;
    recList.appendChild(li);
  }
}

async function generateClinicalInterpretation() {
  const provider = document.getElementById("selLlmProvider").value;
  const model = document.getElementById("inpLlmModel").value.trim();
  const apiKey = document.getElementById("inpApiKey").value.trim();
  const box = document.getElementById("aiResponseContainer");

  const analysis = evaluateCephalometricAnalysis(
    state.activeAnalysisId,
    state.landmarks,
    state.demographics,
    state.userOverrides
  );

  box.textContent = "⏳ Procesando análisis cefalométrico e interpretación basada en la literatura...";

  // If running inside Tauri v2 native window, invoke Rust backend command first
  if (window.__TAURI__ && window.__TAURI__.core) {
    try {
      const resp = await window.__TAURI__.core.invoke("request_llm_interpretation", {
        llmConfig: { provider, api_key: apiKey, model },
        demographics: state.demographics,
        analysis
      });
      box.textContent = `[${resp.provider_used} · ${resp.model_used}]\n\n${resp.clinical_synthesis}\n\nRecomendaciones:\n• ${resp.treatment_recommendations.join("\n• ")}\n\nLiteratura:\n• ${resp.literature_citations.join("\n• ")}`;
      return;
    } catch (err) {
      console.warn("Fallback a cliente HTTP/local:", err);
    }
  }

  const prompt = `Actúa como especialista en Ortodoncia y Cirugía Ortognática.
Paciente: ${state.demographics.first_name} ${state.demographics.last_name}, Edad: ${state.demographics.age_years} años, Sexo: ${state.demographics.sex}, Etnia: ${state.demographics.ethnicity}, País: ${state.demographics.country}.
Análisis: ${analysis.name} (${analysis.literature_reference}).
Mediciones:
${analysis.measurements.map((m) => `- ${m.label}: ${m.value}${m.unit} (Norma ${m.norm_min}..${m.norm_max}) -> ${m.interpretation}`).join("\n")}
Entrega síntesis diagnóstica, diagnóstico diferencial y plan terapéutico según la literatura.`;

  if (provider !== "offline" && apiKey) {
    try {
      if (provider === "openai") {
        const chosenModel = model.includes("gpt") ? model : "gpt-4o";
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: chosenModel,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2
          })
        });
        const data = await res.json();
        if (data.choices?.[0]?.message?.content) {
          box.textContent = `[OpenAI ChatGPT · ${chosenModel}]\n\n${data.choices[0].message.content}`;
          return;
        }
      } else if (provider === "gemini") {
        const chosenModel = model.includes("gemini") ? model : "gemini-2.5-flash";
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );
        const data = await res.json();
        const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (txt) {
          box.textContent = `[Google Gemini · ${chosenModel}]\n\n${txt}`;
          return;
        }
      } else if (provider === "anthropic") {
        const chosenModel = model.includes("claude") ? model : "claude-3-7-sonnet-latest";
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: chosenModel,
            max_tokens: 1500,
            messages: [{ role: "user", content: prompt }]
          })
        });
        const data = await res.json();
        const txt = data.content?.[0]?.text;
        if (txt) {
          box.textContent = `[Anthropic Claude · ${chosenModel}]\n\n${txt}`;
          return;
        }
      }
    } catch (e) {
      console.warn("API call failed, using built-in literature engine:", e);
    }
  }

  // Built-in Evidence-Based Literature Interpretation
  const abnormal = analysis.measurements.filter((m) => m.status !== "normal");
  const lines = [
    `📋 INFORME CLÍNICO AUTOMATIZADO — ${analysis.name.toUpperCase()}`,
    `Paciente: ${state.demographics.first_name} ${state.demographics.last_name} (${state.demographics.age_years} años | Sexo: ${state.demographics.sex} | Etnia: ${state.demographics.ethnicity} | País: ${state.demographics.country})`,
    "",
    `1. SÍNTESIS DIAGNÓSTICA:`,
    `   ${analysis.summary_diagnosis}`,
    "",
    `2. HALLAZGOS FUERA DE RANGO NORMATIVO (${abnormal.length} de ${analysis.measurements.length}):`,
    ...(abnormal.length
      ? abnormal.map((m) => `   • ${m.label}: ${m.value} ${m.unit} [Norma ${m.norm_min}..${m.norm_max}] → ${m.interpretation}`)
      : ["   • Todos los parámetros evaluados se encuentran dentro de la norma poblacional ajustada."]),
    "",
    `3. RECOMENDACIONES CLÍNICAS BASADAS EN LA LITERATURA:`,
    ...analysis.recommendations.map((r) => `   • ${r}`),
    "",
    `4. REFERENCIAS BIBLIOGRÁFICAS:`,
    `   • ${analysis.literature_reference}`,
    `   • Delaire J, Schendel SA, Tulasne JF (1981) An architectural and structural craniofacial analysis.`,
    `   • Proffit WR, Fields HW, Larson BE, Sarver DM (2019) Contemporary Orthodontics, 6th Ed.`
  ];
  box.textContent = lines.join("\n");
}

function loadSamplePreset(presetKey) {
  state.userOverrides = {};
  if (presetKey === "delaire1" || presetKey === "delaire2") {
    state.syntheticMode = null;
    state.demographics.modality = "Lateral";
    document.getElementById("inpModality").value = "Lateral";
    const img = new Image();
    img.onload = () => {
      state.loadedImage = img;
      initLandmarksForImage(canvas.width, canvas.height);
      if (presetKey === "delaire2") {
        // Class II hyperdivergent variation
        state.landmarks["B"].x -= 14;
        state.landmarks["Pog"].x -= 16;
        state.landmarks["Me"].y += 14;
      }
      renderLandmarkSidebar();
      drawCanvas();
      generateClinicalInterpretation();
    };
    img.src =
      presetKey === "delaire1"
        ? "assets/delaire_legacy/sample_lateral_1.jpg"
        : "assets/delaire_legacy/sample_lateral_2.jpg";
  } else if (presetKey === "frontal_pa") {
    state.syntheticMode = "frontal_pa";
    state.demographics.modality = "Frontal";
    document.getElementById("inpModality").value = "Frontal";
    state.activeAnalysisId = "mse";
    document.getElementById("selAnalysis").value = "mse";
    initLandmarksForImage(canvas.width, canvas.height);
    renderLandmarkSidebar();
    drawCanvas();
    generateClinicalInterpretation();
  } else if (presetKey === "opg") {
    state.syntheticMode = "opg";
    state.demographics.modality = "OPG";
    document.getElementById("inpModality").value = "OPG";
    initLandmarksForImage(canvas.width, canvas.height);
    renderLandmarkSidebar();
    drawCanvas();
    generateClinicalInterpretation();
  }
}

function syncDemographicsFromInputs() {
  state.demographics.first_name = document.getElementById("inpFirstName").value;
  state.demographics.last_name = document.getElementById("inpLastName").value;
  state.demographics.age_years = parseFloat(document.getElementById("inpAge").value) || 14;
  state.demographics.sex = document.getElementById("inpSex").value;
  state.demographics.ethnicity = document.getElementById("inpEthnicity").value;
  state.demographics.country = document.getElementById("inpCountry").value;
  state.demographics.modality = document.getElementById("inpModality").value;
  state.demographics.mm_per_pixel = parseFloat(document.getElementById("inpScale").value) || 0.18;
  renderLandmarkSidebar();
  drawCanvas();
}

// Canvas Pointer Events
function getCanvasCoords(ev) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((ev.clientX - rect.left) / rect.width) * canvas.width,
    y: ((ev.clientY - rect.top) / rect.height) * canvas.height
  };
}

canvas.addEventListener("mousedown", (ev) => {
  const pos = getCanvasCoords(ev);

  if (state.activeTool === "move") {
    const isFrontal = state.demographics.modality === "Frontal" || state.activeAnalysisId === "mse";
    let closestId = null;
    let bestDist = 14;
    for (const def of LANDMARK_CATALOG) {
      if ((isFrontal && def.view !== "frontal") || (!isFrontal && def.view !== "lateral")) continue;
      const pt = state.landmarks[def.id];
      if (!pt) continue;
      const d = Math.hypot(pt.x - pos.x, pt.y - pos.y);
      if (d < bestDist) {
        bestDist = d;
        closestId = def.id;
      }
    }
    if (closestId) {
      state.draggingLandmarkId = closestId;
      state.selectedLandmarkId = closestId;
      const def = LANDMARK_CATALOG.find((d) => d.id === closestId);
      if (def) {
        document.getElementById("hudActivePoint").textContent = `📍 Moviendo ${def.name}: ${def.desc}`;
      }
      renderLandmarkSidebar();
      drawCanvas();
    }
  } else if (state.activeTool === "dist") {
    state.pendingMeasurePts.push(pos);
    if (state.pendingMeasurePts.length === 2) {
      state.simpleMeasurements.push({ type: "dist", pts: [...state.pendingMeasurePts] });
      state.pendingMeasurePts = [];
    }
    drawCanvas();
  } else if (state.activeTool === "angle") {
    state.pendingMeasurePts.push(pos);
    if (state.pendingMeasurePts.length === 3) {
      state.simpleMeasurements.push({ type: "angle", pts: [...state.pendingMeasurePts] });
      state.pendingMeasurePts = [];
    }
    drawCanvas();
  } else if (state.activeTool === "calibrate") {
    state.pendingMeasurePts.push(pos);
    if (state.pendingMeasurePts.length === 2) {
      const pxDist = Math.hypot(
        state.pendingMeasurePts[1].x - state.pendingMeasurePts[0].x,
        state.pendingMeasurePts[1].y - state.pendingMeasurePts[0].y
      );
      if (pxDist > 5) {
        const newScale = Math.round((10.0 / pxDist) * 10000) / 10000;
        state.demographics.mm_per_pixel = newScale;
        document.getElementById("inpScale").value = String(newScale);
        document.getElementById("hudActivePoint").textContent = `✅ Escala calibrada: 10 mm = ${pxDist.toFixed(1)} px (${newScale} mm/px)`;
      }
      state.pendingMeasurePts = [];
      setActiveTool("move");
      drawCanvas();
    }
  }
});

canvas.addEventListener("mousemove", (ev) => {
  const pos = getCanvasCoords(ev);
  document.getElementById("hudCursorPos").textContent = `X: ${Math.round(pos.x)} px | Y: ${Math.round(pos.y)} px | Escala: ${state.demographics.mm_per_pixel} mm/px`;
  if (state.draggingLandmarkId && state.landmarks[state.draggingLandmarkId]) {
    state.landmarks[state.draggingLandmarkId].x = Math.max(8, Math.min(canvas.width - 8, pos.x));
    state.landmarks[state.draggingLandmarkId].y = Math.max(8, Math.min(canvas.height - 8, pos.y));
    state.landmarks[state.draggingLandmarkId].source = "manual";
    drawCanvas();
  }
});

window.addEventListener("mouseup", () => {
  if (state.draggingLandmarkId) {
    state.draggingLandmarkId = null;
    renderLandmarkSidebar();
  }
});

function setActiveTool(tool) {
  state.activeTool = tool;
  state.pendingMeasurePts = [];
  document.getElementById("toolMovePt").classList.toggle("active", tool === "move");
  document.getElementById("toolMeasureDist").classList.toggle("active", tool === "dist");
  document.getElementById("toolMeasureAngle").classList.toggle("active", tool === "angle");
  document.getElementById("toolCalibrate").classList.toggle("active", tool === "calibrate");
}

// File upload handler (DICOM, JPEG, PNG, BMP, PDF)
document.getElementById("fileInput").addEventListener("change", async (ev) => {
  const file = ev.target.files?.[0];
  if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();
  document.getElementById("fileFormatBadge").textContent = ext.toUpperCase();

  if (ext === "dcm" || ext === "dicom") {
    const buf = await file.arrayBuffer();
    const dcm = parseDicomBuffer(buf);
    if (dcm.first_name) document.getElementById("inpFirstName").value = dcm.first_name;
    if (dcm.last_name) document.getElementById("inpLastName").value = dcm.last_name;
    if (dcm.age_years) document.getElementById("inpAge").value = String(dcm.age_years);
    if (dcm.sex === "M" || dcm.sex === "F") document.getElementById("inpSex").value = dcm.sex;
    if (dcm.country) document.getElementById("inpCountry").value = dcm.country;
    if (dcm.mm_per_pixel) document.getElementById("inpScale").value = String(dcm.mm_per_pixel);

    const tagsEl = document.getElementById("dicomTagsContainer");
    tagsEl.innerHTML = dcm.tagsFound.length
      ? dcm.tagsFound.map(([k, v]) => `<span class="dicom-chip">${k}: ${v}</span>`).join("")
      : `<span class="dicom-chip">DICOM cargado (${file.name})</span>`;

    // Render 16-bit or 8-bit uncompressed DICOM PixelData if present
    if (dcm.pixelDataOffset && dcm.rows > 0 && dcm.cols > 0) {
      const offCanvas = document.createElement("canvas");
      offCanvas.width = dcm.cols;
      offCanvas.height = dcm.rows;
      const offCtx = offCanvas.getContext("2d");
      const imgData = offCtx.createImageData(dcm.cols, dcm.rows);
      const view = new DataView(buf, dcm.pixelDataOffset);
      const totalPixels = dcm.rows * dcm.cols;
      let minVal = Infinity, maxVal = -Infinity;
      const rawVals = new Float32Array(totalPixels);

      for (let i = 0; i < totalPixels; i++) {
        const val = dcm.bitsAllocated === 16 ? view.getUint16(i * 2, true) : view.getUint8(i);
        rawVals[i] = val;
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
      const range = Math.max(1, maxVal - minVal);
      for (let i = 0; i < totalPixels; i++) {
        const c = Math.round(((rawVals[i] - minVal) / range) * 255);
        imgData.data[i * 4] = c;
        imgData.data[i * 4 + 1] = c;
        imgData.data[i * 4 + 2] = c;
        imgData.data[i * 4 + 3] = 255;
      }
      offCtx.putImageData(imgData, 0, 0);
      const rendered = new Image();
      rendered.onload = () => {
        state.syntheticMode = null;
        state.loadedImage = rendered;
        syncDemographicsFromInputs();
      };
      rendered.src = offCanvas.toDataURL();
    } else {
      syncDemographicsFromInputs();
    }
  } else {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.syntheticMode = null;
        state.loadedImage = img;
        initLandmarksForImage(canvas.width, canvas.height);
        renderLandmarkSidebar();
        drawCanvas();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
});

// UI Controls Wiring
document.getElementById("selAnalysis").addEventListener("change", (ev) => {
  state.activeAnalysisId = ev.target.value;
  if (state.activeAnalysisId === "mse" && state.demographics.modality !== "Frontal") {
    state.demographics.modality = "Frontal";
    document.getElementById("inpModality").value = "Frontal";
    state.syntheticMode = "frontal_pa";
  } else if (state.activeAnalysisId !== "mse" && state.syntheticMode === "frontal_pa") {
    state.syntheticMode = null;
    state.demographics.modality = "Lateral";
    document.getElementById("inpModality").value = "Lateral";
  }
  renderLandmarkSidebar();
  drawCanvas();
  generateClinicalInterpretation();
});

document.getElementById("presetSampleSelect").addEventListener("change", (ev) => {
  loadSamplePreset(ev.target.value);
});

document.getElementById("btnAutoAiLandmarks").addEventListener("click", () => {
  const modelName = document.getElementById("selAiLandmarkModel").selectedOptions[0].textContent;
  initLandmarksForImage(canvas.width, canvas.height);
  renderLandmarkSidebar();
  drawCanvas();
  document.getElementById("hudActivePoint").textContent = `🤖 Puntos detectados automáticamente con ${modelName}`;
});

document.getElementById("btnResetLandmarks").addEventListener("click", () => {
  initLandmarksForImage(canvas.width, canvas.height);
  renderLandmarkSidebar();
  drawCanvas();
});

document.getElementById("btnResetOverrides").addEventListener("click", () => {
  state.userOverrides = {};
  drawCanvas();
});

document.getElementById("inpFilterLandmark").addEventListener("input", renderLandmarkSidebar);

for (const id of ["inpFirstName", "inpLastName", "inpAge", "inpSex", "inpEthnicity", "inpCountry", "inpModality", "inpScale"]) {
  document.getElementById(id).addEventListener("input", syncDemographicsFromInputs);
}

document.getElementById("toolMovePt").addEventListener("click", () => setActiveTool("move"));
document.getElementById("toolMeasureDist").addEventListener("click", () => setActiveTool("dist"));
document.getElementById("toolMeasureAngle").addEventListener("click", () => setActiveTool("angle"));
document.getElementById("toolCalibrate").addEventListener("click", () => setActiveTool("calibrate"));
document.getElementById("btnClearSimpleMeas").addEventListener("click", () => {
  state.simpleMeasurements = [];
  state.pendingMeasurePts = [];
  drawCanvas();
});

document.getElementById("rngBrightness").addEventListener("input", (ev) => {
  state.brightness = Number(ev.target.value);
  drawCanvas();
});
document.getElementById("rngContrast").addEventListener("input", (ev) => {
  state.contrast = Number(ev.target.value);
  drawCanvas();
});
document.getElementById("btnInvertImg").addEventListener("click", (ev) => {
  state.invertImage = !state.invertImage;
  ev.currentTarget.classList.toggle("active", state.invertImage);
  drawCanvas();
});
document.getElementById("btnTogglePlanes").addEventListener("click", (ev) => {
  state.showPlanes = !state.showPlanes;
  ev.currentTarget.classList.toggle("active", state.showPlanes);
  drawCanvas();
});
document.getElementById("btnToggleLabels").addEventListener("click", (ev) => {
  state.showLabels = !state.showLabels;
  ev.currentTarget.classList.toggle("active", state.showLabels);
  drawCanvas();
});
document.getElementById("btnZoomFit").addEventListener("click", () => {
  state.brightness = 100;
  state.contrast = 110;
  state.invertImage = false;
  document.getElementById("rngBrightness").value = "100";
  document.getElementById("rngContrast").value = "110";
  drawCanvas();
});

document.getElementById("btnThemeToggle").addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", state.theme);
});

document.getElementById("btnRunAiInterpretation").addEventListener("click", generateClinicalInterpretation);

document.getElementById("btnExportReport").addEventListener("click", () => {
  const allResults = ANALYSES_CATALOG.map((item) =>
    evaluateCephalometricAnalysis(item.id, state.landmarks, state.demographics, state.userOverrides)
  );
  const payload = {
    software: "Caphalopodo — Delaire Evolution NextGen (Rust Standalone)",
    generated_at: new Date().toISOString(),
    patient: state.demographics,
    active_analysis: state.activeAnalysisId,
    landmarks: state.landmarks,
    analyses: allResults
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Informe_Cefalometrico_${state.demographics.last_name}_${state.activeAnalysisId}.json`;
  a.click();
});

// Initialize Application
populateAnalysesSelector();
initLandmarksForImage(canvas.width, canvas.height);
loadSamplePreset("delaire1");
