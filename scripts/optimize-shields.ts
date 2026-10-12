import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from "fs";
import { getShieldPaths } from "./shared/shield-paths.js";
import { optimizeShieldSvg } from "./shared/svg-optimization.js";

const rawDir = "raw/svg";
const assetsDir = "assets/svg";

if (!existsSync(assetsDir)) {
  mkdirSync(assetsDir, { recursive: true });
}

const files = readdirSync(rawDir).filter((f) => f.endsWith(".svg"));

for (const file of files) {
  console.log(`Optimizing: ${file}`);
  const paths = getShieldPaths(file.slice(0, -".svg".length));
  const content = readFileSync(paths.rawSvg, "utf8");
  const optimized = optimizeShieldSvg(content, paths.rawSvg);

  writeFileSync(paths.optimizedSvg, optimized);
  console.log(`Optimized ${file}`);
}
