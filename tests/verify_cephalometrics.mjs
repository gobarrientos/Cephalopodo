import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LANDMARK_CATALOG,
  ANALYSES_CATALOG,
  evaluateCephalometricAnalysis,
  parseDicomBuffer,
  angle3Pts,
  distMm
} from "../src/ceph_engine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Verify geometric primitives (FonctionsForScriptedElements.dll parity)
assert.equal(Math.round(angle3Pts({ x: 100, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 100 })), 90);
assert.equal(distMm({ x: 0, y: 0 }, { x: 100, y: 0 }, 0.15), 15);

// 2. Verify all 17 cephalometric analyses compute valid normative metrics and traced planes
const ptsMap = {};
for (const def of LANDMARK_CATALOG) {
  ptsMap[def.id] = { x: def.nx * 900, y: def.ny * 760 };
}
const demo = {
  first_name: "Camila",
  last_name: "Valdés",
  age_years: 13.5,
  sex: "F",
  ethnicity: "Hispanic/Latin",
  country: "Chile",
  modality: "Lateral",
  mm_per_pixel: 0.18
};

assert.equal(ANALYSES_CATALOG.length, 17, "Must include all 17 requested cephalometric analyses");

for (const item of ANALYSES_CATALOG) {
  const res = evaluateCephalometricAnalysis(item.id, ptsMap, demo);
  assert.ok(res.measurements.length >= 3, `Analysis ${item.id} must have measurements`);
  assert.ok(res.traced_lines.length >= 2, `Analysis ${item.id} must have traced lines`);
  assert.ok(res.summary_diagnosis.length > 10, `Analysis ${item.id} must have summary diagnosis`);
  assert.ok(res.recommendations.length >= 1, `Analysis ${item.id} must have literature recommendations`);
  console.log(`[OK] ${res.name}: ${res.measurements.length} parámetros, ${res.traced_lines.length} planos trazados`);
}

// 3. Verify synthetic DICOM Part 10 buffer parsing
const dicomBuf = new ArrayBuffer(256);
const u8 = new Uint8Array(dicomBuf);
const dv = new DataView(dicomBuf);
// "DICM" magic at offset 128
u8[128] = 0x44; u8[129] = 0x49; u8[130] = 0x43; u8[131] = 0x4d;
// Tag (0010,0010) PN "Garcia^Mateo"
dv.setUint16(132, 0x0010, true);
dv.setUint16(134, 0x0010, true);
u8[136] = "P".charCodeAt(0); u8[137] = "N".charCodeAt(0);
const nameBytes = new TextEncoder().encode("Garcia^Mateo");
dv.setUint16(138, nameBytes.length, true);
u8.set(nameBytes, 140);

const parsedDcm = parseDicomBuffer(dicomBuf);
assert.equal(parsedDcm.isDicom, true);
assert.equal(parsedDcm.last_name, "Garcia");
assert.equal(parsedDcm.first_name, "Mateo");
console.log(`[OK] DICOM Part 10 Parser: PatientName -> Nombre="${parsedDcm.first_name}", Apellido="${parsedDcm.last_name}"`);

// 4. Verify copied legacy Delaire Evolution assets exist
const legacyDir = path.join(__dirname, "../src/assets/delaire_legacy");
assert.ok(fs.existsSync(path.join(legacyDir, "sample_lateral_1.jpg")));
assert.ok(fs.existsSync(path.join(legacyDir, "Top_12.xml")));
console.log("[OK] Delaire Evolution legacy radiographs & XML models verified.");
