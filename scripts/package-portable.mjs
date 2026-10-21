// Genera paquetes portables por SO en dist/. Uso: node scripts/package-portable.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const version = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
fs.rmSync(dist, { recursive: true, force: true });

const common = ["src", "server.mjs", "README.md", "docs/INSTALACION.md"];
const launchers = {
  windows: {
    "Iniciar_Caphalopodo.bat": fs.readFileSync(path.join(root, "Iniciar_Caphalopodo.bat"), "utf8").replace(/\r?\n/g, "\r\n"),
  },
  macos: { "iniciar.command": unixLauncher("open") },
  linux: { "iniciar.sh": unixLauncher("xdg-open") },
};

function unixLauncher(opener) {
  return `#!/bin/sh
cd "$(dirname "$0")" || exit 1
PORT=4173
if command -v node >/dev/null 2>&1; then
  (sleep 1; ${opener} "http://localhost:$PORT" >/dev/null 2>&1) &
  exec node server.mjs
elif command -v python3 >/dev/null 2>&1; then
  echo "Node.js no encontrado; usando Python 3 (http://localhost:$PORT)"
  (sleep 1; ${opener} "http://localhost:$PORT" >/dev/null 2>&1) &
  exec python3 -m http.server $PORT --bind 127.0.0.1 --directory src
else
  echo "Instala Node.js 18+ (https://nodejs.org) o Python 3." >&2
  exit 1
fi
`;
}

for (const [osName, files] of Object.entries(launchers)) {
  const name = `Caphalopodo-${version}-${osName}-portable`;
  const stage = path.join(dist, name);
  fs.mkdirSync(stage, { recursive: true });
  for (const rel of common) {
    fs.cpSync(path.join(root, rel), path.join(stage, path.basename(rel) === "INSTALACION.md" ? "INSTALACION.md" : rel), { recursive: true });
  }
  for (const [file, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(stage, file), content, { mode: 0o755 });
  }
  if (osName === "windows") {
    execFileSync("powershell", ["-NoProfile", "-Command",
      `Compress-Archive -Path '${stage}\\*' -DestinationPath '${path.join(dist, name)}.zip' -Force`]);
  } else {
    execFileSync("tar", ["-czf", `${name}.tar.gz`, name], { cwd: dist });
  }
  console.log("OK", name);
}
