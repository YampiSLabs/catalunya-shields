import { existsSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { readJson } from "./shared/fs.js";

const municipalities = readJson<any[]>("data/municipalities.json");
const assetsDir = "assets/svg";
const candidatesDir = "data/commons-candidates";

// 1. Gather status of all municipalities
const downloadedList: any[] = [];
const pendingList: any[] = [];

for (const m of municipalities) {
  const svgPath = join(assetsDir, `${m.slug}.svg`);
  const hasSvg = existsSync(svgPath);

  const candidatePath = join(candidatesDir, `${m.slug}.json`);
  const hasCandidate = existsSync(candidatePath);

  const statusInfo = {
    ...m,
    hasSvg,
    hasCandidate,
  };

  if (hasSvg) {
    downloadedList.push(statusInfo);
  } else {
    pendingList.push(statusInfo);
  }
}

// 2. Generate src/index.ts exports
downloadedList.sort((a, b) => a.componentName.localeCompare(b.componentName));
let indexContent = "";
for (const m of downloadedList) {
  indexContent += `export { default as ${m.componentName} } from "../assets/svg/${m.slug}.svg";\n`;
}

if (!existsSync("src")) {
  mkdirSync("src", { recursive: true });
}
writeFileSync("src/index.ts", indexContent, "utf8");
console.log(`Generated src/index.ts with ${downloadedList.length} exports.`);

// 3. Generate docs/shields-status.md
const total = municipalities.length;
const downloadedCount = downloadedList.length;
const pendingCount = pendingList.length;
const percent = total > 0 ? ((downloadedCount / total) * 100).toFixed(1) : "0.0";

// Group by province
const provinces = ["Barcelona", "Girona", "Lleida", "Tarragona"];
const grouped: Record<string, { downloaded: any[]; pending: any[]; all: any[] }> = {};

for (const prov of provinces) {
  grouped[prov] = { downloaded: [], pending: [], all: [] };
}

// Group municipalities
for (const m of [...downloadedList, ...pendingList]) {
  const prov = m.province || "Unknown";
  if (!grouped[prov]) {
    grouped[prov] = { downloaded: [], pending: [], all: [] };
  }
  grouped[prov].all.push(m);
  if (m.hasSvg) {
    grouped[prov].downloaded.push(m);
  } else {
    grouped[prov].pending.push(m);
  }
}

// Sort municipalities alphabetically within each province
for (const prov in grouped) {
  grouped[prov].all.sort((a, b) => a.name.localeCompare(b.name, "ca"));
}

let statusMd = `# Catalunya Shields Status 🛡️\n\n`;
statusMd += `Total municipalities: **${total}**\n`;
statusMd += `Downloaded: **${downloadedCount}**\n`;
statusMd += `Pending: **${pendingCount}**\n`;
statusMd += `Progress: **${percent}%**\n\n`;

// Progress bar representation
const barWidth = 30;
const filledWidth = Math.round((downloadedCount / total) * barWidth);
const emptyWidth = barWidth - filledWidth;
const progressBar = "█".repeat(filledWidth) + "░".repeat(emptyWidth);
statusMd += `\`[${progressBar}] ${percent}%\`\n\n`;

statusMd += `## Provinces Overview\n\n`;

for (const prov of provinces) {
  const data = grouped[prov];
  if (!data) continue;
  const provTotal = data.all.length;
  const provDownloaded = data.downloaded.length;
  const provPercent = provTotal > 0 ? ((provDownloaded / provTotal) * 100).toFixed(1) : "0.0";

  statusMd += `<details>\n`;
  statusMd += `<summary><b>${prov} (${provDownloaded}/${provTotal} - ${provPercent}%)</b></summary>\n\n`;
  
  statusMd += `| Municipality | Slug | Status |\n`;
  statusMd += `| :--- | :--- | :--- |\n`;
  
  for (const m of data.all) {
    let statusText = "❌ Pending";
    if (m.hasSvg) {
      statusText = "✅ Downloaded";
    } else if (m.hasCandidate) {
      statusText = "🔍 Has Candidate";
    }
    statusMd += `| ${m.name} | \`${m.slug}\` | ${statusText} |\n`;
  }
  
  statusMd += `\n</details>\n\n`;
}

if (!existsSync("docs")) {
  mkdirSync("docs", { recursive: true });
}
writeFileSync("docs/shields-status.md", statusMd, "utf8");
console.log(`Generated docs/shields-status.md successfully.`);
