import { readJson, writeJson } from "./shared/fs.js";
import {
  buildCommonsSearchQueries,
  searchCommonsFiles,
  getImageUrl,
  downloadFile,
  WikimediaRateLimitError,
} from "./shared/commons.js";
import {
  scoreCandidate,
  type ScoredCandidate,
} from "./shared/candidates.js";
import { selectRotatingBatch } from "./shared/progression.js";
import { join } from "path";
import { existsSync } from "fs";

type Municipality = {
  name: string;
  slug: string;
};

type CommonsFile = { title: string };

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const municipalityFilter = args
  .find((a) => a.startsWith("--municipality="))
  ?.split("=")[1];
const legacyLimit = parseInt(
  args.find((a) => a.startsWith("--limit="))?.split("=")[1] || "5",
);
const reviewLimit = parseInt(
  args.find((a) => a.startsWith("--review-limit="))?.split("=")[1] ||
    String(legacyLimit),
);
const downloadLimit = parseInt(
  args.find((a) => a.startsWith("--download-limit="))?.split("=")[1] ||
    String(legacyLimit),
);

const municipalities = readJson<Municipality[]>("data/municipalities.json");
const filtered = municipalityFilter
  ? municipalities.filter((m) => m.slug === municipalityFilter)
  : municipalities;

const requestDelayMs = parseInt(process.env.WIKIMEDIA_DELAY_MS || "10000");
const fallbackDelayMs = parseInt(
  process.env.WIKIMEDIA_FALLBACK_DELAY_MS || "1000",
);
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  let reviewed = 0;
  let downloaded = 0;
  const pending = filtered.filter(
    (m) => !existsSync(join("raw/svg", `${m.slug}.svg`)),
  );
  const { items: reviewBatch, startIndex } = selectRotatingBatch(
    pending,
    reviewLimit,
  );

  console.log(
    `Pending=${pending.length}; reviewing=${reviewBatch.length}; rotation-start=${startIndex + 1}`,
  );

  for (const m of reviewBatch) {
    if (downloaded >= downloadLimit) {
      console.log(
        `Limit reached: reviewed=${reviewed}/${reviewLimit}, downloaded=${downloaded}/${downloadLimit}`,
      );
      break;
    }

    const outputPath = join("raw/svg", `${m.slug}.svg`);
    reviewed += 1;
    await delay(requestDelayMs);

    const candidateMap = new Map<string, ScoredCandidate>();
    const queries = buildCommonsSearchQueries(m.name);
    let rateLimited = false;

    console.log(`Reviewing: ${m.name} (${m.slug})`);
    for (const [queryIndex, query] of queries.entries()) {
      if (queryIndex > 0) await delay(fallbackDelayMs);

      let files: CommonsFile[];
      try {
        console.log(`Searching Commons (${queryIndex + 1}/${queries.length}): ${query}`);
        files = (await searchCommonsFiles(query)) as CommonsFile[];
      } catch (error) {
        if (error instanceof WikimediaRateLimitError) {
          console.warn(error.message);
          rateLimited = true;
          break;
        }
        throw error;
      }

      for (const file of files) {
        const candidate = scoreCandidate(file, m.name);
        const key = file.title.toLocaleLowerCase();
        const current = candidateMap.get(key);
        if (!current || candidate.score > current.score) {
          candidateMap.set(key, candidate);
        }
      }

      if (
        [...candidateMap.values()].some(
          (candidate) => candidate.confidence === "high",
        )
      ) {
        break;
      }
    }

    const candidates = [...candidateMap.values()].sort(
      (a, b) => b.score - a.score || a.title.localeCompare(b.title),
    );
    const best = candidates.find((candidate) => candidate.confidence === "high");

    console.log(
      `Found ${candidates.length} candidates for ${m.name}. Safe match: ${best?.title ?? "none"}`,
    );

    if (!dryRun && candidates.length > 0) {
      writeJson(`data/commons-candidates/${m.slug}.json`, candidates);
    }

    if (best) {
      if (dryRun) {
        console.log(
          `Dry run: would download ${best.title} to ${outputPath}`,
        );
        continue;
      }

      let url: string | undefined;
      try {
        url = await getImageUrl(best.title);
      } catch (error) {
        if (error instanceof WikimediaRateLimitError) {
          console.warn(error.message);
          rateLimited = true;
        } else {
          throw error;
        }
      }

      if (url) {
        await downloadFile(url, outputPath);
        downloaded += 1;
        console.log(
          `Downloaded: ${outputPath} (${downloaded}/${downloadLimit})`,
        );
      } else {
        console.warn(`No downloadable image URL for ${best.title}`);
      }
    } else {
      console.warn(
        `No exact, current SVG shield match for ${m.name}; candidates=${candidates.length}`,
      );
    }

    if (rateLimited) break;
  }

  console.log(
    `Completed: reviewed=${reviewed}/${reviewBatch.length}, downloaded=${downloaded}/${downloadLimit}, pending-at-start=${pending.length}`,
  );
}

run();
