import { readJson, writeJson } from "./shared/fs.js";
import {
  createSlug,
  createComponentName,
  createAliases,
  normalizeSearchText,
} from "./shared/text.js";

const raw = readJson<any[]>("data/municipalities.raw.json");

const normalized = raw.map((m) => ({
  name: m.name,
  slug: createSlug(m.name),
  componentName: createComponentName(m.name),
  province: m.province,
  aliases: createAliases(m.name),
  searchKey: normalizeSearchText(m.name),
}));

writeJson("data/municipalities.json", normalized);
console.log(`Normalized ${normalized.length} municipalities.`);
