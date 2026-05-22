import { readJson, writeJson } from "./shared/fs.js";
import {
  searchCommonsFiles,
  getImageUrl,
  downloadFile,
  WikimediaRateLimitError,
} from "./shared/commons.js";
import { scoreCandidate } from "./shared/candidates.js";
import { join } from "path";
import { existsSync } from "fs";

type Municipality = {
  name: string;
  slug: string;
};

type CommonsFile = {
  title: string;
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const municipalityFilter = args
  .find((a) => a.startsWith("--municipality="))
  ?.split("=")[1];
const limit = parseInt(
  args.find((a) => a.startsWith("--limit="))?.split("=")[1] || "5",
);

const municipalities = readJson<Municipality[]>("data/municipalities.json");
const filtered = municipalityFilter
  ? municipalities.filter((m) => m.slug === municipalityFilter)
  : municipalities;

const requestDelayMs = parseInt(process.env.WIKIMEDIA_DELAY_MS || "10000");
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  let reviewed = 0;
  let downloaded = 0;

  for (const m of filtered) {
    if (reviewed >= limit || downloaded >= limit) {
      console.log(
        `Limit reached: reviewed=${reviewed}, downloaded=${downloaded}, limit=${limit}`,
      );
      break;
    }

    const outputPath = join("raw/svg", `${m.slug}.svg`);
    if (existsSync(outputPath)) {
      console.log(`Skipping: ${m.name} (already downloaded)`);
      continue;
    }

    reviewed += 1;
    await delay(requestDelayMs);

    let files: CommonsFile[];
    try {
      console.log(`Searching for: ${m.name}`);
      const query = `Escut de ${m.name}.svg`;
      files = (await searchCommonsFiles(query)) as CommonsFile[];
    } catch (error) {
      if (error instanceof WikimediaRateLimitError) {
        console.warn(error.message);
        break;
      }
      throw error;
    }

    const candidates = files.map((f) =>
      scoreCandidate({ title: f.title, mime: "image/svg+xml" }, m.name),
    );
    candidates.sort((a, b) => b.score - a.score);

    const best = candidates[0];
    console.log(
      `Found ${candidates.length} candidates for ${m.name}. Top: ${best?.title} (Score: ${best?.score})`,
    );

    if (best && best.score >= 100) {
      if (dryRun) {
        console.log(
          `Dry run: would write candidates and download ${best.title} to ${outputPath}`,
        );
        continue;
      }

      writeJson(`data/commons-candidates/${m.slug}.json`, candidates);

      let url: string | undefined;
      try {
        url = await getImageUrl(best.title);
      } catch (error) {
        if (error instanceof WikimediaRateLimitError) {
          console.warn(error.message);
          break;
        }
        throw error;
      }

      if (url) {
        await downloadFile(url, outputPath);
        downloaded += 1;
        console.log(`Downloaded: ${outputPath} (${downloaded}/${limit})`);
        await delay(requestDelayMs);
      }
    } else {
      console.warn(`No high confidence candidate for ${m.name}`);
    }
  }

  console.log(
    `Completed: reviewed=${reviewed}, downloaded=${downloaded}, limit=${limit}`,
  );
}

run();
