import { readJson, writeJson } from "./shared/fs.js";
import {
  searchCommonsFiles,
  getImageUrl,
  downloadFile,
} from "./shared/commons.js";
import { scoreCandidate } from "./shared/candidates.js";
import { join } from "path";
import { existsSync } from "fs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const municipalityFilter = args
  .find((a) => a.startsWith("--municipality="))
  ?.split("=")[1];
const limit = parseInt(
  args.find((a) => a.startsWith("--limit="))?.split("=")[1] || "5",
);

const municipalities = readJson<any[]>("data/municipalities.json");
const filtered = municipalityFilter
  ? municipalities.filter((m) => m.slug === municipalityFilter)
  : dryRun
    ? municipalities.slice(0, limit)
    : municipalities;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  for (const m of filtered) {
    const outputPath = join("raw/svg", `${m.slug}.svg`);
    if (existsSync(outputPath)) {
      console.log(`Skipping: ${m.name} (already downloaded)`);
      continue;
    }

    await delay(5000); // Much longer delay to respect rate limits

    console.log(`Searching for: ${m.name}`);
    const query = `Escut de ${m.name}.svg`;
    const files = await searchCommonsFiles(query);

    const candidates = files.map((f) =>
      scoreCandidate({ title: f.title, mime: "image/svg+xml" }, m.name),
    );
    candidates.sort((a, b) => b.score - a.score);

    const best = candidates[0];
    console.log(
      `Found ${candidates.length} candidates for ${m.name}. Top: ${best?.title} (Score: ${best?.score})`,
    );

    if (best && best.score >= 100) {
      writeJson(`data/commons-candidates/${m.slug}.json`, candidates);

      if (!dryRun) {
        const url = await getImageUrl(best.title);
        if (url) {
          await downloadFile(url, outputPath);
          console.log(`Downloaded: ${outputPath}`);
          await delay(5000); // Respect rate limits after download
        }
      }
    } else {
      console.warn(`No high confidence candidate for ${m.name}`);
    }
  }
}

run();
