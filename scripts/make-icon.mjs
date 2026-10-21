// Genera src-tauri/app-icon.png (1024x1024) sin dependencias. Luego: npx tauri icon src-tauri/app-icon.png
import zlib from "node:zlib";
import fs from "node:fs";

const N = 1024;
const raw = Buffer.alloc((N * 4 + 1) * N);
for (let y = 0; y < N; y++) {
  raw[y * (N * 4 + 1)] = 0;
  for (let x = 0; x < N; x++) {
    const o = y * (N * 4 + 1) + 1 + x * 4;
    const t = (x + y) / (2 * N);
    const dx = x - N / 2, dy = y - N / 2;
    const inCircle = Math.hypot(dx, dy) < N * 0.34 && Math.hypot(dx, dy) > N * 0.26;
    raw[o] = inCircle ? 255 : Math.round(14 + 85 * t);
    raw[o + 1] = inCircle ? 255 : Math.round(165 - 66 * t);
    raw[o + 2] = inCircle ? 255 : Math.round(233 + 8 * t);
    raw[o + 3] = 255;
  }
}
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (b) => {
  let c = 0xffffffff;
  for (const v of b) c = crcTable[(c ^ v) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 6;
fs.writeFileSync(
  new URL("../src-tauri/app-icon.png", import.meta.url),
  Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]),
);
console.log("app-icon.png generado");
